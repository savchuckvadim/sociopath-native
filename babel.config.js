module.exports = function (api) {
    api.cache(true);
    let plugins = [];

    // react-native-worklets/plugin заменяет react-native-reanimated/plugin в версии 4.x
    // Должен быть последним в списке плагинов
    plugins.push('react-native-worklets/plugin');
    plugins.push('inline-dotenv');
    return {
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

        plugins,
    };
};
