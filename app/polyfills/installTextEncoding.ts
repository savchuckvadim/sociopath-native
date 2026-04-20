/**
 * Hermes `TextDecoder` не принимает метки вроде `utf-16le`, которые использует
 * glue-код Emscripten в `@privacyresearch/curve25519-typescript` (зависимость libsignal).
 * Подменяем глобальные TextDecoder/TextEncoder полифиллом до загрузки Signal.
 */
import { TextDecoder as TextDecoderPolyfill, TextEncoder as TextEncoderPolyfill } from 'text-encoding';

const g = globalThis as typeof globalThis & {
  TextDecoder: typeof TextDecoderPolyfill;
  TextEncoder: typeof TextEncoderPolyfill;
};

g.TextDecoder = TextDecoderPolyfill;
g.TextEncoder = TextEncoderPolyfill;
