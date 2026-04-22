// packages/nest-api/orval.config.ts
export default {
    api: {
        input:
            process.env.ORVAL_INPUT ||
            'http://localhost:3000/docs/api-json',
        output: {
            target: 'app/api/generated/api.ts',
            client: 'axios', // или 'react-query'
            prettier: true,
            mode: 'tags-split',
            schemas: 'app/api/generated/model',

            override: {
                mutator: {
                    path: './app/api/lib/back-api.ts',
                    name: 'customAxios',
                },
            },

        },
    },
};
