async function testLogin() {
    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'mobil.az@gmail.com',
                password: '1921021418.az'
            })
        });
        const data = await res.json();
        console.log(res.status, data);
    } catch (e) {
        console.error(e.message);
    }
}
testLogin();
