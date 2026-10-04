# Groq API Setup Guide: VERIDOC AI

VERIDOC AI uses **Groq** for high-throughput, ultra-low-latency document-grounded inference with strict structured JSON output.

---

## 1. How to Create a Free Groq API Key

1. Navigate to the [Groq Console](https://console.groq.com/).
2. Sign up or log in using your Google, GitHub, or email credentials.
3. Once logged in, click on **API Keys** in the left sidebar menu (or go directly to [console.groq.com/keys](https://console.groq.com/keys)).
4. Click the **+ Create API Key** button.
5. Enter a descriptive name for your key, e.g., `veridoc-ai-key`.
6. Click **Submit** or **Create**.
7. **Copy the key immediately** (starts with `gsk_...`). *Groq will only show you this key once.*

---

## 2. Free Tier Limits & Supported Models

Groq offers a generous free tier ideal for hackathons, testing, and production prototypes:

| Model ID | Context Window | Best Used For | Recommended for VERIDOC |
| :--- | :--- | :--- | :--- |
| **`llama-3.3-70b-versatile`** | **128k tokens** | Complex financial reasoning, numerical precision, table comprehension | **YES (Default)** |
| `llama-3.1-8b-instant` | 128k tokens | High-speed lightweight QA, sub-200ms latency | Excellent for low latency |
| `mixtral-8x7b-32768` | 32k tokens | Broad multi-step retrieval | Alternative |

Groq free tier limits (typically 30 RPM, 6,000 TPM for 70B, and up to 14,400 RPD) easily handle typical benchmarking and evaluation workloads.

---

## 3. Where to Put the Groq Key in `.env`

In your root `.env` file (copied from `.env.example`):

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### Verification Test
To verify your Groq connection, you can query the `/api/health` endpoint once the backend is running, or check the **System Health** page in the VERIDOC AI UI. The backend will confirm:
```json
{
  "groq": {
    "status": "connected",
    "model": "llama-3.3-70b-versatile"
  }
}
```

---

## 4. Structured JSON Output Enforcement

VERIDOC AI instructs Groq to output valid, structured JSON adhering to the grounding schema:

```json
{
  "supported": true,
  "answer": "Apple's total net sales in FY2023 were $383,285 million, representing a 2.8% decrease from FY2022.",
  "confidence": 0.96,
  "citations": [
    {
      "document": "Apple_2023_10K.pdf",
      "page": 24,
      "chunk": "chunk-18"
    }
  ]
}
```

If the retrieved context lacks sufficient evidence, Groq strictly outputs:

```json
{
  "supported": false,
  "answer": "I don't know based on the provided documents.",
  "citations": []
}
```

This JSON response is then passed through **VERIDOC AI's Second-Layer Hallucination Verifier** before reaching the user.
