import os, subprocess, requests, time

TOKEN = os.environ.get("TELEGRAM_TOKEN")
BASE = f"https://api.telegram.org/bot{TOKEN}"

# Sənin Telegram ID-n - bot yalnız sənə qulaq asacaq
# Bunu sonra öyrənəcəyik, hələlik hamıya açıq qoyuruq, sonra bağlayacağıq

def send(chat_id, text):
    requests.post(f"{BASE}/sendMessage", json={"chat_id": chat_id, "text": text[:4000]})

last_id = 0
print("Mobilim Bot işləyir...")
while True:
    try:
        r = requests.get(f"{BASE}/getUpdates", params={"offset": last_id+1, "timeout": 30}).json()
        for u in r.get("result", []):
            last_id = u["update_id"]
            msg = u.get("message", {})
            chat_id = msg.get("chat", {}).get("id")
            text = msg.get("text", "")
            if not text or text.startswith("/"):
                continue
            send(chat_id, "Başa düşdüm, Mobilim.az-da işləyirəm... ⏳")
            # agy agentinə ötürürük - main-ə toxunmadan, development-də işləyir
            prompt = f"Mobilim.az layihəsində, development branch-də işlə. Main branch-a toxunma. Tapşırıq: {text}. Dəyişiklikləri et, test et, sonra development branch-a push et. Qısa cavab ver."
            out = subprocess.run(["agy", "-p", prompt], capture_output=True, text=True, timeout=600)
            reply = out.stdout[-3500:] if out.stdout else "Xəta oldu, yenidən cəhd et."
            send(chat_id, f"Oldu ✅\n{reply}")
    except Exception as e:
        print(e)
        time.sleep(5)
        