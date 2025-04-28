import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose'; // Importa Types de mongoose
import { UserRole } from 'src/users/dto/user.dto';

// Define possible actions
export enum Action {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete',
}

// Define rule format
export interface Rule {
    action: Action;
    subject: string;
    conditions?: any;
    fields?: string[];
    inverted?: boolean;
}

// Define abilities container
export interface Ability {
    rules: Rule[];
}

@Injectable()
export class AbilityFactory {
    defineAbilitiesFor(user: any): Ability { // Cambiamos User por any para evitar problemas de tipo
        const rules: Rule[] = [];

        // Si el usuario no existe o no tiene rol, devolver reglas vacías
        if (!user || !user.role) {
            return { rules };
        }

        // Normalizar el rol para manejar tanto string como enum
        const userRole = user.role.toLowerCase();

        // Editor abilities
        if (userRole === UserRole.EDITOR) {
            // Obtenemos el ID de manera segura
            const userId = user._id || user.id;

            rules.push({
                action: Action.Read,
                subject: 'all',
            });

            rules.push({
                action: Action.Create,
                subject: 'Product',
            });

            rules.push({
                action: Action.Create,
                subject: 'Category',
            });

            // User can update their own products
            rules.push({
                action: Action.Update,
                subject: 'Product',
                conditions: { createdBy: userId },
            });

            rules.push({
                action: Action.Update,
                subject: 'Category',
                conditions: { createdBy: userId },
            });

            // User can delete their own products
            rules.push({
                action: Action.Delete,
                subject: 'Product',
                conditions: { createdBy: userId },
            });

            rules.push({
                action: Action.Delete,
                subject: 'Category',
                conditions: { createdBy: userId },
            });
        }

        // Admin abilities
        if (userRole === UserRole.ADMIN) {
            // Admin can manage all
            rules.push({
                action: Action.Manage,
                subject: 'all',
            });
        }
        
        // Logging para depuración
        console.log(`[AbilityFactory] User role: ${userRole}, Rules count: ${rules.length}`);
        
        return { rules };
    }

    can(ability: Ability, action: Action, subject: string, data?: any): boolean {
        // Si no hay reglas o habilidad definida, denegar acceso
        if (!ability || !ability.rules) {
            console.log('[AbilityFactory] No ability or rules defined');
            return false;
        }
        
        const manageRule = ability.rules.find(
            (rule) =>
                rule.action === Action.Manage &&
                (rule.subject === 'all' || rule.subject === subject),
        );

        if (manageRule) {
            console.log(`[AbilityFactory] User has manage permission for ${subject}`);
            return true;
        }

        // Check for specific action rules
        const rules = ability.rules.filter(
            (rule) =>
                (rule.action === action || rule.action === Action.Manage) &&
                (rule.subject === 'all' || rule.subject === subject),
        );

        // No rules = no permission
        if (rules.length === 0) {
            console.log(`[AbilityFactory] No rules found for ${action} on ${subject}`);
            return false;
        }

        // Check conditions if they exist
        const result = rules.some((rule) => {
            if (!rule.conditions) {
                return true;
            }

            // Check all conditions
            return Object.entries(rule.conditions).every(([key, value]) => {
                // Si estamos comparando ObjectIds, necesitamos convertirlos a string
                if (data && data[key] && value) {
                    // Si el valor es un ObjectId, conviértelo a string para comparar
                    const dataValue = data[key] instanceof Types.ObjectId ?
                        data[key].toString() : data[key];
                    const condValue = value instanceof Types.ObjectId ?
                        value.toString() : value;

                    return dataValue === condValue;
                }
                return false;
            });
        });
        
        console.log(`[AbilityFactory] Permission check result for ${action} on ${subject}: ${result}`);
        return result;
    }
}