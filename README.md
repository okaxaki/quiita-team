# これは何？

quiita-team は [Qiita Team](http://qiita.com/) からエクスポートした json ファイルを解析して、HTML ファイルに変換するツールです

- 記事とプロジェクトに対応しています。
- 生成された HTML はローカルブラウザで表示できます。
- 記事が参照している画像もダウンロードできます。

記事数が非常に多いケースは想定していませんが、数千記事程度であれば問題なく動作すると思います。

なお、QiitaTeamが生成する json ファイルは日々変化するようなので、最新のjsonファイルで動作しないかもしれません。
筆者の環境では 2015年10月末ごろの json ファイルで動作を確認しました。
このリポジトリのメンテは終了していますので、バグなどあれば fork でお願いします。

# インストール

このリポジトリをgitから直接インストールしてください。

`npm install -g <repository-url>`

その後、次を実行します。

`$ quiita-team foobar.json`

- 引数には Qiita Team からエクスポートした json ファイルを指定します。
- jsonファイルが gz 圧縮されている場合は、あらかじめ解凍してください。

上記のコマンドを実行すると、カレントディレクトリに `qiita-team-html` ディレクトリが作成されて、HTMLが生成されます。
また、記事内の画像も可能な限りダウンロードします。

# 画像がダウンロードされない場合

2015年8月3日以降に Qiita Team にアップロードされた画像は、Qiita Teamにログインしないと取得できません。
[参考:Qiitaのヘルプ](http://help.qiita.com/ja/articles/qiita-team-image-access-control)

quiita-team コマンドを実行する際に、-c オプションでクッキーファイルを指定すると、Qiita Teamにログインして画像をダウンロードできます。

`$ quiita-team foobar.json -c cookie_file`

cookie_file クッキーファイルの中には Qiita TeamへのログインCookieの値をそのまま貼り付けてください。
値のみで、ヘッダ名`Cookie:`は不要です。

Cookieヘッダはブラウザの開発者メニューなどでリクエストヘッダを見れば確認できます。

# コマンドライン オプション

こんな感じで出力ディレクトリが指定できたり、画像ダウンロードをしなかったりできます。

```
Usage: quiita-team JSON_FILE [OPTION]
  -o, --outdir=DIR   specify output directory (default: quiita-team-html).
  -c, --cookie=FILE  specify cookie file to login qiita.com.
  -n, --no-download  Don't download image resources.
  -h, --help         show this help.
```

