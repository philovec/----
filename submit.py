from playwright.sync_api import sync_playwright

def automate_form():
    with sync_playwright() as p:
        # ブラウザを起動（動きが見えるように headless=False にしています）
        browser = p.chromium.launch()
        
        # 1. コンテキストの作成と【位置情報の許可】
        # ここで 'geolocation' の権限をあらかじめ与えておきます
        context = browser.new_context()
        
        page = context.new_page()
        
        # 対象のURLへ移動（実際のURLに書き換えてください）
        page.goto("https://philovec.github.io/----/")
        
        # ==========================================
        # 2. フォームの操作
        # ==========================================
        # id="menu" の div の中にある select 要素で「送信」を選択
        page.locator("#menu select").select_option(label="送信")
        
        # ==========================================
        # 3. ボタンクリックとGAS通信（alert）の待機
        # ==========================================
        print("送信ボタンをクリックし、GASの処理完了を待機します...")
        
        # 以下の with ブロック内でクリックを行うと、アラートが出るまで処理を一時停止して待ってくれます。
        # timeout=60000 は「最大60秒待つ」という設定です（GASが重い対策）。
        with page.expect_event("dialog", timeout=60000) as dialog_info:
            page.locator("#submit-btn").click()
            
        # アラートが出現したら、そのオブジェクトを取得
        dialog = dialog_info.value
        
        # アラートの中身（テキスト）をターミナルに表示
        print(f"GASからの応答（アラート）: {dialog.message}")
        
        # アラートの「OK」を押して閉じる（これをしないと次の操作に進めません）
        dialog.accept() 
        
        print("処理が正常に完了しました。")
        
        # ブラウザを閉じる
        browser.close()

if __name__ == "__main__":
    automate_form()