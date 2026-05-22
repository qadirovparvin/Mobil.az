const fs = require('fs');
let css = fs.readFileSync('c:/Users/Gadirov/Desktop/AiryPhone - COPY/Front end/CSS/login.css', 'utf8');

// Replace dark mode HEX codes with general.css variables
css = css.replace(/\[data-theme="dark"\] body \.auth-page \{\s*background: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .auth-page {\n    background: var(--bg-primary);');
css = css.replace(/\[data-theme="dark"\] body \.auth-form-panel \{\s*background: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .auth-form-panel {\n    background: var(--bg-secondary);');
css = css.replace(/\[data-theme="dark"\] body \.auth-tabs \{\s*background: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .auth-tabs {\n    background: var(--input-bg);');
css = css.replace(/\[data-theme="dark"\] body \.auth-tab-btn \{\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .auth-tab-btn {\n    color: var(--text-secondary);');
css = css.replace(/\[data-theme="dark"\] body \.auth-heading \{\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .auth-heading {\n    color: var(--text-primary);');
css = css.replace(/\[data-theme="dark"\] body \.auth-subheading \{\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .auth-subheading {\n    color: var(--text-secondary);');

css = css.replace(/\[data-theme="dark"\] body \.verify-method-btn \{\s*border-color: #[0-9a-fA-F]+;\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .verify-method-btn {\n    border-color: var(--border-color);\n    color: var(--text-secondary);');
css = css.replace(/\[data-theme="dark"\] body \.social-btn \{\s*border-color: #[0-9a-fA-F]+;\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .social-btn {\n    border-color: var(--border-color);\n    color: var(--text-secondary);');

css = css.replace(/\[data-theme="dark"\] body \.auth-divider \{\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .auth-divider {\n    color: var(--text-secondary);');
css = css.replace(/\[data-theme="dark"\] body \.auth-divider::before,\n\[data-theme="dark"\] body \.auth-divider::after \{\s*background: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .auth-divider::before,\n[data-theme="dark"] body .auth-divider::after {\n    background: var(--border-color);');

css = css.replace(/\[data-theme="dark"\] body \.input-group label \{\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .input-group label {\n    color: var(--text-secondary);');
css = css.replace(/\[data-theme="dark"\] body \.input-group input,\n\[data-theme="dark"\] body \.input-group select \{\s*background: #[0-9a-fA-F]+;\s*border-color: #[0-9a-fA-F]+;\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .input-group input,\n[data-theme="dark"] body .input-group select {\n    background: var(--input-bg);\n    border-color: var(--border-color);\n    color: var(--text-primary);');

css = css.replace(/\[data-theme="dark"\] body \.input-group input:focus,\n\[data-theme="dark"\] body \.input-group select:focus \{\s*border-color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .input-group input:focus,\n[data-theme="dark"] body .input-group select:focus {\n    border-color: var(--accent-color);');

css = css.replace(/\[data-theme="dark"\] body \.remember-me span \{\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .remember-me span {\n    color: var(--text-secondary);');
css = css.replace(/\[data-theme="dark"\] body \.terms-row label \{\s*color: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .terms-row label {\n    color: var(--text-secondary);');

css = css.replace(/\[data-theme="dark"\] body \.step-dot \{\s*background: #[0-9a-fA-F]+;/g, '[data-theme="dark"] body .step-dot { background: var(--border-color);');

fs.writeFileSync('c:/Users/Gadirov/Desktop/AiryPhone - COPY/Front end/CSS/login.css', css);
console.log('Fixed login.css dark mode variables!');
