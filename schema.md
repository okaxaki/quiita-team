# 2015年8月下旬以降のスキーマ

## Qiita JSON
|Property|Type|Note|
|----|----|----|
|articles|[ARTICLE]||

## ARTICLE
|Property|Type|Note|
|---|---|---|
|id|String|20 characters in hex (80bits)|
|user|USER||
|title|String||
|created_at|DATE||
|updated_at|DATE||
|created_at_in_words|String|画面表示用の日付|
|updated_at_in_words|String|画面表示用の日付|
|tags|[TAG]||
|stock_count|Number|ストック数|
|comment_count|Number|コメント数|
|url|String|記事のURL|
|created_at_seconds|Number||
|lgtm_count|Number||
|private|Bool||
|coediting|Bool||
|body|String|Markdown形式の本文|
|rendered_body|String|HTML形式の本文|
|stock_users|[USER]||
|comments|[COMMENT]||

## USER
|Property|Type|Note|
|---|---|---|
|permanent_id|Number|内部ユーザーID|
|id|String|ユーザ識別子|
|profile_image_url|String|プロフィール画像のURL|

## TAG
|Property|Type|Note|
|---|---|---|
|name|String|タグの表示名|
|versions|[Unknown]||


# 2015年8月中旬までのスキーマ

## Qiita JSON
|Property|Type|Note|
|----|----|----|
|articles|[ARTICLE]||

## ARTICLE
|Property|Type|Note|
|---|---|---|
|id|Number||
|uuid|String|20 characters in hex (80bits)|
|user|USER||
|title|String||
|created_at|DATE||
|updated_at|DATE||
|created_at_in_words|String|画面表示用の日付|
|updated_at_in_words|String|画面表示用の日付|
|tags|[TAG]||
|stock_count|Number|ストック数|
|comment_count|Number|コメント数|
|url|String|記事のURL|
|created_at_seconds|Number||
|lgtm_count|Number||
|private|Bool||
|coediting|Bool||
|raw_body|String|Markdown形式の本文|
|body|String|HTML形式の本文|
|stock_users|[USER]||
|comments|[COMMENT]||

## USER
|Property|Type|Note|
|---|---|---|
|id|Number|内部ユーザーID|
|url_name|String|ユーザ識別子|
|profile_image_url|String|プロフィール画像のURL|

## TAG
|Property|Type|Note|
|---|---|---|
|name|String|タグの表示名|
|url_name|String|タグの識別子|
|versions|[Unknown]||