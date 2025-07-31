const fs = require("fs");
const QRCode = require("qrcode");
const crypto = require("crypto");

const SECRET = "hihi";
const OUTPUT_FILE = "qr.html";

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[-T:]/g, "").slice(0, 12);
}

function generateToken(timestamp, secret) {
  return crypto
    .createHash("sha256")
    .update(timestamp + secret)
    .digest("hex")
    .substring(0, 8);
}

async function generateHTMLPage() {
  const timestamp = getTimestamp();
  const currentDate = new Date();

  const weekday = currentDate.toLocaleDateString("en-US", { weekday: "long" });
  const month = currentDate.toLocaleDateString("en-US", { month: "long" });
  const day = currentDate.getDate();
  const hour = currentDate.getHours().toString().padStart(2, "0");
  const minute = currentDate.getMinutes().toString().padStart(2, "0");

  const timeFormatted = `${hour}:${minute}`;
  const dateFormatted = `${weekday}, ${month} ${day}`;

  const qrData = generateToken(timestamp, SECRET);
  const opts = {
    version: "2",
    type: "vector/svg",
    quality: 100,
    margin: 1,
    scale: 20,
  };
  const qrDataURL = await QRCode.toDataURL(qrData, opts);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance QR</title>
      <meta http-equiv="refresh" content="60">
      <link href="https://fonts.googleapis.com/css2?family=Jockey+One&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: #f1f1f1;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .card {
          background-color: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          text-align: center;
          width: 400px;
          position: relative;
        }

        h1 {
          color: #4f46e5;
          font-size: 18px;
          margin-bottom: 30px;
        }

        .date {
          font-size: 16px;
          color: #444;
        }

        .time {
          font-size: 60px;
          color: #4f46e5;
          font-weight: bold;
          margin-bottom: 20px;
          font-family: 'Jockey One', sans-serif;
          line-height: 1;
        }

        .qr-wrapper {
          position: relative;
          width: 260px;
          height: 260px;
          display: inline-block;
        }

        .qr-wrapper img {
          width: 100%;
          height: 100%;
          border: 2px solid black;
          padding: 5px;
          border-radius: 4px;
          background: white;
          box-sizing: border-box;
          display: block;
        }

        .progress-container {
          pointer-events: none;
          position: absolute;
          top: 1px;
          left: 1px;
          width: 257px;
          height: 257px;
        }

        .progress-bar {
          position: absolute;
          background-color: #4f46e5;
          transform: scale(0);
        }

        .bar-top {
          top: 0;
          left: 0;
          height: 6px;
          width: 100%;
          transform-origin: left;
        }

        .bar-right {
          top: 0;
          right: 0;
          width: 6px;
          height: 100%;
          transform-origin: top;
        }

        .bar-bottom {
          bottom: 0;
          right: 0;
          height: 6px;
          width: 100%;
          transform-origin: right;
        }

        .bar-left {
          bottom: 0;
          left: 0;
          width: 6px;
          height: 100%;
          transform-origin: bottom;
        }

        .scan-text {
          margin-top: 10px;
          color: #465284;
          font-size: 14px;
        }

        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #777;
        }

        .credit {
          display: block;
          margin-top: 6px;
          color: black;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Attendance Control System</h1>
        <div class="date">${dateFormatted}</div>
        <div class="time">${timeFormatted}</div>
        <div class="qr-wrapper">
          <img src="${qrDataURL}" alt="QR Code">
          <div class="progress-container">
            <div class="progress-bar bar-top"></div>
            <div class="progress-bar bar-right"></div>
            <div class="progress-bar bar-bottom"></div>
            <div class="progress-bar bar-left"></div>
          </div>
        </div>
        <div class="scan-text">Please Scan The QR Code</div>
        <div class="footer">
          A project Done in OSB Teknokent by:
          <p class="credit">İpek Zorpineci - Ravad Nadam - Sude Terkan</p>
        </div>
      </div>

      <script>
        const duration = 60000;

        function animateBar(element, keyframes, delay) {
          element.style.transform = keyframes[0].transform;
          element.animate(keyframes, {
            duration: duration * 0.25,
            delay,
            fill: "forwards"
          });
        }

        const topBar = document.querySelector(".bar-top");
        const rightBar = document.querySelector(".bar-right");
        const bottomBar = document.querySelector(".bar-bottom");
        const leftBar = document.querySelector(".bar-left");

        animateBar(topBar,    [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], 0);
        animateBar(rightBar,  [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], duration * 0.25);
        animateBar(bottomBar, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], duration * 0.5);
        animateBar(leftBar,   [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], duration * 0.75);
      </script>
    </body>
    </html>
  `;

  fs.writeFileSync(OUTPUT_FILE, html, "utf-8");
  console.log(`[${new Date().toLocaleTimeString()}] QR code updated: ${qrData}`);
}

generateHTMLPage();
setInterval(generateHTMLPage, 60 * 1000);
