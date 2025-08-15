interface InvitationArgs {
    recipientEmail: string;
    inviteMessage?: string;
}
interface AppSyncIdentity {
    claims?: any;
    username?: string;
}
interface AppSyncEvent {
    arguments: InvitationArgs;
    identity?: AppSyncIdentity;
}
export declare const handler: (event: AppSyncEvent) => Promise<string>;
export {};
