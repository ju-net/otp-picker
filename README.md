# OTP Picker

GmailからOTP（ワンタイムパスワード）コードを取得し、素早く入力できるデスクトップアプリケーションです。

## 特徴

- **グローバルホットキー**: どのアプリからでも `Cmd+Shift+O`（カスタマイズ可能）で呼び出し
- **Raycast風UI**: フローティングウィンドウでフルスクリーンアプリの上にも表示
- **自動OTP抽出**: メール本文から認証コードを自動抽出
- **柔軟な入力方法**: クリップボードコピーまたは自動タイピング
- **カスタムキーワード**: OTP検索用のキーワードを自由に設定
- **クロスプラットフォーム**: macOS / Windows / Linux 対応

## インストール

[Releases](https://github.com/ju-net/otp-picker/releases) から各プラットフォーム用のインストーラーをダウンロードしてください。

| プラットフォーム | ファイル |
|---|---|
| macOS (Apple Silicon) | `OTP Picker-x.x.x-arm64.dmg` |
| macOS (Intel) | `OTP Picker-x.x.x.dmg` |
| Windows | `OTP Picker Setup x.x.x.exe` |
| Linux | `OTP Picker-x.x.x.AppImage` または `otp-picker_x.x.x_amd64.deb` |

## セットアップ

### 1. Google Cloud Console でOAuth認証情報を作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuthクライアントID」を選択
5. アプリケーションの種類: **デスクトップアプリ**
6. 作成後、**Client ID** と **Client Secret** をメモ

### 2. Gmail API を有効化

1. 「APIとサービス」→「ライブラリ」に移動
2. 「Gmail API」を検索して有効化

### 3. OAuth同意画面を設定

1. 「APIとサービス」→「OAuth同意画面」に移動
2. ユーザータイプ: 外部（または内部）
3. 必要な情報を入力
4. スコープに `https://www.googleapis.com/auth/gmail.readonly` を追加
5. テストユーザーに自分のGmailアドレスを追加（外部の場合）

### 4. アプリの設定

1. OTP Picker を起動
2. 初回起動時に Client ID と Client Secret を入力
3. 「Googleでログイン」をクリックして認証

## 使い方

1. **ホットキーで呼び出し**: `Cmd+Shift+O`（デフォルト）
2. **OTPを選択**: 一覧から使用したいOTPコードをクリック
3. **自動入力またはコピー**: 設定に応じてコードが入力またはコピーされます

### 入力方法

| 方法 | 説明 |
|---|---|
| クリップボードにコピー | OTPコードをクリップボードにコピー（`Cmd+V` で貼り付け） |
| 自動入力 | 直前のウィンドウに自動でタイピング入力 |
| 毎回確認 | 選択時にどちらの方法を使うか確認 |

> **Note**: 自動入力にはmacOSでアクセシビリティ権限が必要です。

## 設定

設定画面（歯車アイコン）から以下を設定できます:

- **Google OAuth設定**: Client ID / Client Secret
- **ホットキー**: アプリを呼び出すショートカットキー
- **OTP検索キーワード**: メールを検索するキーワード（デフォルト: 認証コード, verification code, OTP など）
- **入力方法**: クリップボード / 自動入力 / 毎回確認
- **自動更新**: OTPリストの自動更新間隔

## 開発

### 必要環境

- Node.js 20+
- npm

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/ju-net/otp-picker.git
cd otp-picker

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### ビルド

```bash
# 現在のプラットフォーム向けにビルド
npm run build

# プラットフォーム別ビルド
npm run build:mac
npm run build:win
npm run build:linux
```

### 型チェック

```bash
npm run typecheck
```

## 技術スタック

- **フレームワーク**: Electron
- **UI**: React + TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **ビルド**: Vite + electron-builder
- **API**: Gmail API (OAuth 2.0)

## ライセンス

MIT

## 作者

[ju-net](https://github.com/ju-net)
