import { SetMetadata } from "@nestjs/common";
import { Action } from "src/abilities/ability.factory";

export interface PolicyHandler {
    action : Action;
    subject: string;
    checkData?: boolean;
}

export const CHECK_POLICIES_KEY = 'check_policies';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
    SetMetadata(CHECK_POLICIES_KEY, handlers);