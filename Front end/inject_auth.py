import os

base_dir = r"c:\Users\Gadirov\Desktop\AiryPhone - COPY\Front end"

for filename in os.listdir(base_dir):
    if filename.endswith(".html"):
        filepath = os.path.join(base_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        # We only inject if it's not already injected. login and signup already have it manually.
        if "auth.js" not in content and "auth.ts" not in content:
            new_content = content.replace('<script src="JS/script.js"></script>', '<script src="JS/auth.js"></script>\n    <script src="JS/script.js"></script>')
            # And also script.js?v=2 because in about and cabinet we put v=2
            new_content = new_content.replace('<script src="JS/script.js?v=2"></script>', '<script src="JS/auth.js"></script>\n    <script src="JS/script.js?v=2"></script>')
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
                
print("Injection complete.")
