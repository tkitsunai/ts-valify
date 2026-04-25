# CLAUDE.md

AIコーディングエージェント向けのコードベース概要と開発ガイドライン。

## プロジェクト概要

`@tkitsunai/ts-valify` は TypeScript ファーストの バリデーションライブラリです。デコレータを使ってコンストラクタの不変条件とスキーマバリデーションを宣言的に定義できます。

- **パッケージ名**: `@tkitsunai/ts-valify`
- **バージョン**: 0.1.2
- **ランタイム**: Bun >=1.0.0
- **モジュール形式**: ESM (`"type": "module"`)
- **公開先**: npm (public)

## ディレクトリ構造

```
ts-valify/
├── src/                        # TypeScript ソースコード
│   ├── index.ts               # パブリック API のエクスポート定義
│   ├── types.ts               # Rule, Specification, ValidationError など型定義
│   ├── decorators.ts          # @Valified, @UsePolicy, @Satisfies デコレータ
│   ├── engine.ts              # バリデーションエンジン本体
│   ├── storage.ts             # Symbol ベースのメタデータ管理
│   └── rules/                 # 組み込みバリデーションルール
│       ├── index.ts           # ルールのエクスポート (30種超)
│       ├── strings.ts         # 文字列バリデーション
│       ├── number.ts          # 数値バリデーション
│       └── date.ts            # 日付バリデーション
├── tests/                      # テストスイート (Bun test)
│   ├── valify.test.ts         # メインテスト (コンストラクタ不変条件, ネスト, Spec)
│   ├── storage.test.ts        # メタデータストレージのテスト
│   └── rules/
│       ├── strings.test.ts
│       ├── numbers.test.ts
│       └── dates.test.ts
├── .agents/
│   └── skills/tdd/SKILL.md    # TDD 開発スキル (実装時に参照)
├── .github/workflows/          # CI/CD (ci.yml, release.yml)
├── dist/                       # ビルド成果物 (git 管理外)
├── biome.json                  # フォーマッタ・リンタ設定
├── tsconfig.json               # TypeScript 基本設定
├── tsconfig.build.json         # ビルド専用 TypeScript 設定
└── release-please-config.json  # リリース自動化設定
```

## 開発コマンド

```bash
bun test              # テスト実行
bun run test:watch    # ウォッチモードでテスト
bun run test:coverage # カバレッジレポート生成
bun run test:verbose  # 詳細テスト出力
bun run type-check    # TypeScript 型チェック
bun run lint          # Biome リンタ実行
bun run lint:fix      # リンタ自動修正
bun run format        # Biome フォーマット
bun run build         # ビルド (Bun bundle + tsc 型宣言生成)
```

## アーキテクチャ

### 3レイヤー構造

```
Rule (値レベル)  →  @UsePolicy (プロパティレベル)  →  @Satisfies (クラスレベル)
```

1. **Rule** (`types.ts`): `(value, field, data) => string | null` の関数。エラーがなければ `null` を返す
2. **Policy** (`@UsePolicy`): プロパティに Rule を登録するデコレータ
3. **Specification** (`@Satisfies`): 複数フィールドにまたがるクロスフィールド検証

### コアモジュール

| ファイル | 役割 |
|---|---|
| `src/types.ts` | `Rule`, `Specification`, `ValifyError`, `ValifyConfigurationError` の型 |
| `src/storage.ts` | Symbol でクラスのメタデータ (policies, specs) を管理 |
| `src/decorators.ts` | `@Valified`, `@UsePolicy`, `@Satisfies` の実装 |
| `src/engine.ts` | `scan()` 再帰走査, `createValidator()`, `valify` デフォルトインスタンス |
| `src/rules/index.ts` | 組み込みルール 30種以上のエクスポート |

### バリデーションの流れ

```
@Valified() コンストラクタラップ
        ↓
  コンストラクタ完了後に validateOrThrow() を自動呼び出し
        ↓
  engine.scan() → getPolicies(proto) で各フィールドを検証
        ↓
  ネストした @Valified オブジェクトは再帰的に走査
        ↓
  getSpecs(proto) でクロスフィールド検証
        ↓
  エラーがあれば ValifyError をスロー (全エラーを集約)
```

## パブリック API

```typescript
// デコレータ
@Valified()                          // クラス: コンストラクタ不変条件を強制
@UsePolicy(...rules)                 // プロパティ: ルールを登録
@Satisfies(...specifications)        // クラス: クロスフィールド検証

// バリデーションエンジン
valify.validate(proto, data)         // エラー配列を返す
valify.validateSchema(schema, data)  // 複数キーのデータを一括検証
valify.validateOrThrow(instance)     // 失敗時に ValifyError をスロー
valify.result(proto, data)           // { ok: true, data } | { ok: false, errors }

// カスタムバリデータ作成
createValidator({ stopAtFirstError: true, unknownObjectMode: "ignore" })

// 組み込みルール
rules.required(), rules.string(), rules.minLength(n), rules.maxLength(n)
rules.email(), rules.url(), rules.matches(/regex/)
rules.number(), rules.min(n), rules.max(n), rules.inRange(min, max)
rules.date(), rules.dateMin(d), rules.dateMax(d), rules.dateFormat("strict")
```

## バリデーターオプション

| オプション | デフォルト | 説明 |
|---|---|---|
| `stopAtFirstError` | `false` | `true` にすると最初のエラーで停止 |
| `unknownObjectMode` | `"error"` | `@Valified` なしのネストオブジェクトを `"error"` でエラー / `"ignore"` で無視 |

## コーディング規約

### TypeScript
- `strict: true` が有効
- `experimentalDecorators: true` と `emitDecoratorMetadata: true` が必須
- モジュール解決: `bundler` (Bun 向け)
- パスエイリアス: `@` → `./src`

### フォーマット (Biome)
- インデント: 2スペース
- 行幅: 100文字
- セミコロン: 常に付ける
- トレーリングカンマ: ES5 スタイル
- `const` を優先 (警告レベル)
- `console` 使用は許可

### コメント
- コメントは WHY が明確でない場合のみ記述
- 何をするかの説明コメントは不要 (識別子名で表現)

### テスト
- テストフレームワーク: Bun 標準 (`bun:test`) — Jest/Vitest は使わない
- `describe` / `it` / `expect` のシンタックスを使用
- ファイル配置: `tests/` ディレクトリ (src と分離)
- 新機能には必ずテストを追加する

## TDD 開発フロー

実装時は `.agents/skills/tdd/SKILL.md` の TDD スキルに従う。

1. **Red**: 失敗するテストを先に書く
2. **Green**: テストを通過させる最小限の実装を書く
3. **Refactor**: コード品質を向上させるリファクタリングを行う

実装コードより先にテストを書くこと。テストを実行せずに実装してはならない。

## 新しいルールの追加方法

1. `src/rules/strings.ts`, `src/rules/number.ts`, `src/rules/date.ts` のいずれかにルール関数を追加
2. `src/rules/index.ts` でエクスポート
3. 対応するテストを `tests/rules/` に追加
4. `README.md` の API リファレンスを更新

ルール関数のシグネチャ:
```typescript
type Rule = (value: unknown, field: string, data: Record<string, unknown>) => string | null;
```

## エラー型

| 型 | 用途 |
|---|---|
| `ValifyError` | バリデーション失敗時にスローされる (`.errors: ValidationError[]` を持つ) |
| `ValifyConfigurationError` | `unknownObjectMode: "error"` 時に `@Valified` のないネストオブジェクトで発生 |
| `ValidationError` | `{ path: string; message: string }` の個別エラー |

## ビルドと配布

```bash
bun run build
# 1. bun build → dist/index.js (ESM bundle)
# 2. tsc --project tsconfig.build.json → dist/index.d.ts (型宣言)
```

npm に公開されるファイル: `dist/`, `README.md`, `LICENSE`

## リリースフロー

[Conventional Commits](https://www.conventionalcommits.org/) で commit するとリリースが自動化される:

| コミットプレフィックス | バージョン変更 |
|---|---|
| `fix:` | patch (0.0.x) |
| `feat:` | minor (0.x.0) |
| `feat!:` または `BREAKING CHANGE:` | major (x.0.0) |

詳細は `RELEASING.md` を参照。

## 注意事項

- `dist/` は git 管理外。公開前に必ず `bun run build` を実行すること
- TypeScript 5.0+ が必要 (peer dependency)
- デコレータを使うには `tsconfig.json` で `experimentalDecorators: true` が必要
- テストは Bun で実行。Node.js では動作しない可能性がある
- 応答は日本語で行うこと (`AGENTS.md` の指示)
