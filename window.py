import threading
import time
import socket
import webview

from app import app


def run_flask():
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False
    )


threading.Thread(target=run_flask, daemon=True).start()


while True:
    s = socket.socket()
    try:
        s.connect(("127.0.0.1", 5000))
        s.close()
        break
    except:
        time.sleep(0.1)


webview.create_window(
    "Blade Asset Library",
    "http://127.0.0.1:5000",
    width=1400,
    height=850,
    resizable=True
)

# 👇 YE LINE MISSING THI
webview.start()