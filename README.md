# 🛑 Rate Limiter Visualizer

Rate limiting is a **fundamental backend system design principle** used to regulate how often a client can call an API or service.
This project **builds real-world rate limiting algorithms on the backend** and **visualizes their behavior live on the frontend**, making the concepts intuitive and easy to grasp.

### 🎥 Demo

**Drive Link:** [[https://drive.google.com/file/d/1W0jT39CUNEDIaEak-3oMeD8qRct7BvPE/view?usp=sharing](https://drive.google.com/file/d/1W0jT39CUNEDIaEak-3oMeD8qRct7BvPE/view?usp=sharing)]

---

## 🧩 What Is Rate Limiting?

**Rate limiting** defines an upper bound on the number of requests a client can send within a given time interval.

**Example:**
Permit at most **5 requests every 10 seconds per user**.

---

## ⚠️ Why Rate Limiting Matters

Rate limiting is crucial for modern backend systems to:

* Prevent excessive load on servers
* Defend APIs against abuse and DDoS attacks
* Guarantee fair access for all consumers
* Maintain consistent and predictable performance
* Optimize infrastructure and operational costs

Almost every high-scale system applies rate limiting at multiple layers.

---

## 🧪 Implemented Rate Limiting Algorithms

> Each algorithm below is **fully implemented in the backend**.
> The frontend reflects **actual allow / deny decisions** based on real-time request data.

---

### 1️⃣ Fixed Window Counter

Tracks requests within fixed time windows and resets the count whenever a new window starts.

🖼 **Visualization**


https://github.com/user-attachments/assets/2b940924-3b21-435b-a9a3-b8b718ea4e8b



---

### 2️⃣ Sliding Window Log

Stores individual request timestamps and considers only those that fall inside the rolling window.

🖼 **Visualization**


https://github.com/user-attachments/assets/0e96b12f-d652-45ba-b0d4-31979a8a9aa7


---

### 4️⃣ Token Bucket

Requests are permitted as long as tokens are available, with tokens refilled at a constant rate.

🖼 **Visualization**


https://github.com/user-attachments/assets/647fc838-112d-4fe2-a880-8401107244b8



---

### 5️⃣ Leaky Bucket

Processes requests at a steady rate and drops excess traffic once the bucket capacity is exceeded.

🖼 **Visualization**


https://github.com/user-attachments/assets/c6d7a9af-f2f2-4c89-9dd8-55e5dbb15011


---


## 📁 Project Structure

```text
com.saima.rate_limiter
├── config  // Web config
├── controller  // REST endpoints
├── model  // Configuration, state models & ENUM
├── service
│   ├── algorithms  // Rate limiting algorithms
│   ├── factory  // Algorithm selection (Factory pattern)
│   └── RateLimiter  // Service interface
├── store  // In-memory state management
└── RateLimiterApplication.java
```

**Design highlights:**

* Clear separation of **algorithms**, **storage**, and **orchestration**
* Strategy + Factory patterns for easy extensibility
* Each algorithm maintains its own state store

---

## 🛠 Tech Stack

### Frontend

* Next Js
* JavaScript
* Framer Motion
* Tailwind CSS

### Backend

* Java 21
* Spring Boot
* RESTful APIs
* Strategy & Factory design patterns

---

## ▶️ Run Locally

### Clone Repository

```bash
git clone https://github.com/<your-username>/rate-limiter-visualizer.git
cd rate-limiting-visualizer
```

---

### Start Backend

```bash
cd rate-limiter
./mvnw spring-boot:run
```

Backend URL:

```
http://localhost:8080
```

---

### Start Frontend

```bash
cd rate-limiter-frontend
npm install
npm run dev
```

Frontend URL:

```
http://localhost:3000
```

---

## 🔮 Future Enhancements

*  Distributed rate limiting using Redis or similar stores
*  Dynamic limits based on traffic patterns or user tiers
*  Role- or auth-based rate limiting (API keys / JWT)
*  Integration with API gateways and cloud setups

---

## 🤝 Contributions

Contributions are welcome and appreciated!

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m "Implement feature"`)
4. Push to your branch (`git push origin feature-name`)
5. Open a Pull Request






