import { defineStorage } from '@aws-amplify/backend';
export const storage = defineStorage({
    name: 'profileStorage',
    access: (allow) => ({
        'profile-photos/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete'])
        ],
        'cover-photos/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete'])
        ],
        'feed-photos/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete'])
        ],
        'public/*': [
            allow.guest.to(['read']),
            allow.authenticated.to(['read', 'write', 'delete'])
        ]
    })
});
