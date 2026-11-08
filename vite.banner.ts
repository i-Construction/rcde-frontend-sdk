import { THIRD_PARTY_LICENSES_FILE } from "./vite.licenses";

/**
 * dist に出す第三者ソフトウェアの案内。Rollup の banner として出力するが、
 * Vite がヘルパー関数を前に置くため、ファイルの先頭行になるとは限らない。
 * 同梱したパッケージの著作権表示とライセンス全文は、ビルド時に vite.licenses.ts が
 * 集めて THIRD_PARTY_LICENSES.txt に書き出す。手書きで列挙すると依存が増えたときに漏れるため、
 * ここでは置き場所だけを示す。
 */
export const THIRD_PARTY_LICENSE_BANNER = `/*!
 * @i-con/frontend-sdk
 * This bundle includes third-party software. See ${THIRD_PARTY_LICENSES_FILE}
 * in this package for their copyright notices and license texts.
 */`;
