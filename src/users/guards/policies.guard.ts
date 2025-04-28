import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../../abilities/ability.factory';
import { CHECK_POLICIES_KEY, PolicyHandler } from '../decorators/check-policies.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
    private readonly logger = new Logger(PoliciesGuard.name);
    
    constructor(
        private reflector: Reflector,
        private abilityFactory: AbilityFactory,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Public routes are always accessible
        if (isPublic) {
            this.logger.debug('Route is public, allowing access');
            return true;
        }

        const policyHandlers = this.reflector.get<PolicyHandler[]>(
            CHECK_POLICIES_KEY,
            context.getHandler(),
        ) || [];

        // No policy handlers means no special permission checks needed beyond authentication
        if (policyHandlers.length === 0) {
            this.logger.debug('No policy handlers, allowing access (authentication only)');
            return true; // Let the JwtAuthGuard handle authentication
        }

        const request = context.switchToHttp().getRequest();
        const { user } = request;

        // If no user but policies required, deny access
        if (!user) {
            this.logger.warn('No user found but policies are required');
            return false;
        }

        this.logger.debug(`Checking policies for user: ${JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role
        })}`);

        // Define abilities for this user
        const ability = this.abilityFactory.defineAbilitiesFor(user);

        // Log the policy handlers for debugging
        this.logger.debug(`Policy handlers: ${JSON.stringify(policyHandlers)}`);

        // Check all policies - if any handler requires entity data
        const needsEntityCheck = policyHandlers.some(handler => handler.checkData);

        if (needsEntityCheck) {
            const entityId = request.params.id;
            this.logger.debug(`Entity check needed, ID: ${entityId}`);

            // If a policy requires entity checking but no ID is provided, pass for now
            // (The controller method will need to do the check)
            if (!entityId) {
                const result = policyHandlers
                    .filter(handler => !handler.checkData)
                    .every(handler => {
                        const canAccess = this.abilityFactory.can(
                            ability,
                            handler.action,
                            handler.subject,
                        );
                        this.logger.debug(`Can ${handler.action} ${handler.subject} without entity check? ${canAccess}`);
                        return canAccess;
                    });
                return result;
            }

            // Ideally, fetch the entity from its service, but this is controller-specific logic
            // You'll need to implement entity checking in your controller methods
        }

        // Check all policies that don't require entity checks
        const result = policyHandlers.every(handler => {
            if (handler.checkData) {
                this.logger.debug(`Skipping entity check for ${handler.action} ${handler.subject} - will check in controller`);
                return true; // We'll check this in the controller
            }
            
            const canAccess = this.abilityFactory.can(
                ability,
                handler.action,
                handler.subject,
            );
            
            this.logger.debug(`Can ${handler.action} ${handler.subject}? ${canAccess}`);
            return canAccess;
        });

        this.logger.debug(`Final policy check result: ${result}`);
        return result;
    }
}