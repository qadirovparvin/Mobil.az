import os
import re

html_files = [
    f
    for f in os.listdir(".")
    if f.endswith(".html")
]

for filename in html_files:
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = re.sub(
        r'<h3>Əlaqə</h3>',
        r'<h3 class="contact" data-translate="contact">Əlaqə</h3>',
        content
    )

    if new_content != content:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filename}")
