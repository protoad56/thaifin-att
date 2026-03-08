# 🇹🇭 ThaiFin — ระบบวิเคราะห์หุ้นไทยระดับมืออาชีพ

> **เครื่องมือเชิงปริมาณ (Quantitative Toolkit) สำหรับตลาดหลักทรัพย์แห่งประเทศไทย**  
> วิเคราะห์หุ้น 800+ ตัวด้วย DCF Valuation, Quant Screening และ Portfolio Optimisation ในแอปเดียว

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-ISC-lightgray)](LICENSE.md)

---

## ✨ ฟีเจอร์หลัก (Features)

| โมดูล | รายละเอียด |
|---|---|
| 📡 **Systematic Quant Map** | รัน DCF แบบ Base-Case กับหุ้น 800+ ตัวพร้อมกัน แสดง Scatter Map ความถูก vs ความเติบโต |
| 🔍 **Value Screener** | กรองหุ้นตาม ROE, P/E, Dividend Yield ด้วยเกณฑ์ที่ปรับได้ |
| 📊 **Stock Terminal** | ดูข้อมูลงบการเงิน, อัตราส่วนสำคัญ และกราฟแนวโน้มแบบยาว 10 ปี |
| 💰 **DCF Valuation Engine** | ประเมินมูลค่าด้วยสมมติฐาน Bear / Base / Bull และ Preset ตามประเภทธุรกิจ |
| 🎯 **Portfolio Optimiser** | สร้างพอร์ตที่ Efficient Frontier ด้วย Markowitz Mean-Variance Optimization |
| 🏭 **Sector Dynamics** | เปรียบเทียบรายได้และกำไรระหว่างอุตสาหกรรม |
| 📚 **Analysis Hub** | Financial Health, Dividend Hunters, Growth Screen, Sector Rankings |
| 📖 **User Guide** | คู่มือการใช้งานภาษาไทยสำหรับผู้เริ่มต้น |

---

## 🚀 การติดตั้ง (Installation)

### ข้อกำหนดเบื้องต้น (Prerequisites)

- **Python** 3.11 หรือสูงกว่า
- **Node.js** 18 หรือสูงกว่า
- **uv** (Python package manager) — ติดตั้งด้วย `pip install uv` หรือ `curl -LsSf https://astral.sh/uv/install.sh | sh`

### 1. Clone ที่เก็บโค้ด

```bash
git clone https://github.com/your-org/thaifin-att.git
cd thaifin-att
```

### 2. ติดตั้ง Backend

```bash
# สร้าง virtual environment และติดตั้ง dependencies ด้วย uv
uv sync

# เปิดใช้งาน environment
source .venv/bin/activate   # macOS / Linux
# หรือบน Windows:
# .venv\Scripts\activate
```

### 3. ติดตั้ง Frontend

```bash
cd frontend
npm install
cd ..
```

---

## ⚙️ การกำหนดค่า (Configuration)

ไม่มีไฟล์ `.env` ที่บังคับ ระบบจะทำงานแบบ out-of-the-box ด้วยฐานข้อมูล SQLite (`thaifin.db`) ที่รวมมาด้วย

ถ้าต้องการดึงข้อมูลใหม่จากแหล่งภายนอก ให้รัน:

```bash
source .venv/bin/activate
python -m backend.ingest   # หรือใช้ justfile: just ingest
```

---

## 🏃 การรันระบบ (Running the App)

### รัน Backend (FastAPI)

```bash
source .venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

API จะพร้อมใช้งานที่ `http://127.0.0.1:8000`  
ดู API Docs แบบ Interactive ได้ที่ `http://127.0.0.1:8000/docs`

### รัน Frontend (React + Vite)

เปิด terminal ใหม่:

```bash
cd frontend
npm run dev
```

เปิดเบราว์เซอร์ที่ **`http://localhost:5174`**

---

## 🗄️ โครงสร้างโปรเจกต์ (Project Structure)

```
thaifin-att/
├── backend/
│   ├── main.py          # FastAPI application และ API endpoints
│   ├── models.py        # SQLAlchemy database models
│   ├── crud.py          # Database query functions
│   └── ingest.py        # Data ingestion scripts
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Root component, navigation
│   │   ├── Dashboard.jsx        # Stock Terminal
│   │   ├── QuantDashboard.jsx   # Systematic Quant Map
│   │   ├── DCFValuation.jsx     # DCF Engine
│   │   ├── Screener.jsx         # Value Screener
│   │   ├── PortfolioOptimizer.jsx
│   │   ├── AnalysisHub.jsx
│   │   ├── SectorView.jsx
│   │   ├── UserGuide.jsx
│   │   └── index.css            # Global styles (glassmorphism dark theme)
│   └── index.html
├── thaifin/             # Python library สำหรับดึงข้อมูลพื้นฐาน
├── thaifin.db           # SQLite database (ข้อมูลหุ้น)
├── pyproject.toml
└── README.md
```

---

## 📡 API Endpoints หลัก

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/stocks` | ค้นหาและรายการหุ้น |
| GET | `/api/stocks/{symbol}` | ข้อมูลหุ้นรายตัว |
| GET | `/api/stocks/{symbol}/financials` | งบการเงิน |
| GET | `/api/dcf/{symbol}` | DCF Valuation |
| GET | `/api/analysis/market-valuation` | Quant Map data (หุ้นทุกตัว) |
| POST | `/api/portfolio/optimize` | Portfolio optimisation |
| GET | `/api/screener` | Value screening |
| GET | `/api/system/status` | สถานะระบบ |

---

## 🧪 การทดสอบ (Testing)

```bash
source .venv/bin/activate
pytest tests/ -v
```

---

## 🤝 การมีส่วนร่วม (Contributing)

ยินดีรับ Pull Request ทุกรูปแบบ ไม่ว่าจะเป็น bug fix, feature ใหม่ หรือแก้ typo  
กรุณาอ่าน [Contributing Guidelines](.github/CONTRIBUTING.md) ก่อน

---

## ⚠️ ข้อสงวนสิทธิ์ (Disclaimer)

ระบบนี้สร้างขึ้นเพื่อ**วัตถุประสงค์ทางการศึกษาและการวิจัยเท่านั้น**  
ไม่ถือเป็นคำแนะนำทางการเงินหรือการลงทุน  
ผู้ใช้งานต้องรับผิดชอบต่อการตัดสินใจลงทุนด้วยตนเอง  
ข้อมูลที่แสดงอาจมีความล่าช้า และไม่รับประกันความถูกต้องสมบูรณ์

> เราไม่รับประกันความเสียหายใดๆ ที่เกิดจากการใช้งานระบบนี้ทั้งทางตรงและทางอ้อม

---

## 👨‍💻 เครดิตและผู้สร้าง (Credits)

### ผู้พัฒนาและผู้ออกแบบระบบ

**ThaiFin Web Application** สร้างและพัฒนาโดย:

| บทบาท | รายละเอียด |
|---|---|
| **ผู้ออกแบบสถาปัตยกรรมระบบ** | Predaboon ([@predaboon](https://github.com/predaboon)) |
| **เครื่องมือ AI ผู้ช่วยพัฒนา** | Antigravity (Google DeepMind) |

### ข้อมูลพื้นฐานหุ้น

ระบบนี้ใช้ไลบรารี **[thaifin](https://github.com/CircleOnCircles/thaifin)** ซึ่งสร้างโดย **Nutchanon Ninyawee (CircleOnCircles)**  
สำหรับการดึงข้อมูลพื้นฐานหุ้นในตลาดหลักทรัพย์ไทย

### ขอบคุณ (Special Thanks)

- **ตลาดหลักทรัพย์แห่งประเทศไทย (SET)** — แหล่งข้อมูลสาธารณะ
- **Finnomena & Settrade** — แหล่งข้อมูลสนับสนุน
- ชุมชนนักลงทุนไทยทุกท่านที่สนับสนุนและใช้งานระบบนี้

### เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| Backend | FastAPI, SQLAlchemy, SQLite, yfinance, PyPortfolioOpt |
| Frontend | React 18, Vite, Recharts, Lucide React |
| Styling | Vanilla CSS, Glassmorphism Dark Theme |
| Data | thaifin library, SET public data |

---

## 📜 ใบอนุญาต (License)

ISC License — ดูรายละเอียดใน [LICENSE.md](LICENSE.md)

---

<div align="center">
  <p>สร้างด้วย ❤️ สำหรับนักลงทุนไทย</p>
  <p><em>Built with ❤️ for the Thai investment community</em></p>
</div>
