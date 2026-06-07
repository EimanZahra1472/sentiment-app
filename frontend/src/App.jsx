import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiTrash2, FiBarChart2, FiClock } from "react-icons/fi";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("analyze");

  const [fileResults, setFileResults] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);

  const exportToCSV = (data, filename) => {
    const headers = ["Text", "Sentiment", "Confidence"];
    const rows = data.map((item) => [
      `"${item.text.replace(/"/g, "'")}"`,
      item.sentiment,
      item.confidence + "%",
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

const analyzeGroq = async () => {
  if (!text.trim()) return;
  setLoading(true);
  setResult(null);
  setError(null);

  try {
      const response = await axios.post(
        "http://127.0.0.1:8000/predict-groq",
        { text: text }
      );
      if (response.data.error) {
        setError(`Error: ${response.data.error}`);
      } else {
        setResult(response.data);
      }
  } catch (err) {
    setError("Something went wrong. Make sure your API is running!");
  } finally {
    setLoading(false);
  }
};
  const analyzeSentiment = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post("http://127.0.0.1:8000/predict", {
        text: text,
      });
      setResult(response.data);
      setHistory((prev) => [response.data, ...prev].slice(0, 10));
    } catch (err) {
      setError("Something went wrong. Make sure your API is running!");
    } finally {
      setLoading(false);
    }
  };

  const positiveCount = history.filter((h) => h.sentiment === "POSITIVE").length;
  const negativeCount = history.filter((h) => h.sentiment === "NEGATIVE").length;
  const neutralCount = history.filter((h) => h.sentiment === "NEUTRAL").length;
  const avgConfidence = history.length
    ? (history.reduce((a, b) => a + b.confidence, 0) / history.length).toFixed(1)
    : 0;

  const pieData = [
    { name: "Positive", value: positiveCount },
    { name: "Neutral", value: neutralCount },
    { name: "Negative", value: negativeCount },
  ];

  return (
    <div className="app">
      {/* Header */}
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🎯 Sentiment Analyzer</h1>
        <p>Powered by AI — Find out if your text is positive or negative</p>
      </motion.div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "analyze" ? "active" : ""}`}
          onClick={() => setActiveTab("analyze")}
        >
          <FiSend style={{ marginRight: 6 }} />
          Analyze
        </button>
        <button
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <FiClock style={{ marginRight: 6 }} />
          History ({history.length})
        </button>
        <button
          className={`tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <FiBarChart2 style={{ marginRight: 6 }} />
          Dashboard
        </button>
        <button
  className={`tab ${activeTab === "file" ? "active" : ""}`}
  onClick={() => setActiveTab("file")}
>
  📁 File Upload
</button>
<button
  className={`tab ${activeTab === "paragraph" ? "active" : ""}`}
  onClick={() => setActiveTab("paragraph")}
>
  📝 Paragraph
</button>
<button
  className={`tab ${activeTab === "bert" ? "active" : ""}`}
  onClick={() => setActiveTab("bert")}
>
  � Groq LLaMA3
</button>
      </div>

      {/* Analyze Tab */}
      {activeTab === "analyze" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: 680 }}
        >
          <div className="card">
            <textarea
              placeholder="Type or paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
            />
            <div className="char-count">{text.length} characters</div>
            <button
              className="btn-primary"
              onClick={analyzeSentiment}
              disabled={loading || !text.trim()}
            >
              {loading ? "Analyzing... ⏳" : "Analyze Sentiment 🔍"}
            </button>
            
          </div>

          {/* Error */}
          {error && (
            <motion.div
              className="error-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                className={`result-card ${
                  result.sentiment === "POSITIVE"
                    ? "result-positive"
                    : result.sentiment === "NEUTRAL"
                    ? "result-neutral"
                    : "result-negative"
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <div className="result-title">
                  {result.sentiment === "POSITIVE" ? (
                    <span className="positive-text">✅ POSITIVE</span>
                  ) : result.sentiment === "NEUTRAL" ? (
                    <span className="neutral-text">⚪ NEUTRAL</span>
                  ) : (
                    <span className="negative-text">❌ NEGATIVE</span>
                  )}
                </div>

                <p className="result-text">
                  <strong style={{ color: "#f8fafc" }}>Text:</strong>{" "}
                  {result.text}
                </p>

                <div className="confidence-label">
                  Confidence: {result.confidence}%
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                      backgroundColor:
                        result.sentiment === "POSITIVE"
                          ? "#22c55e"
                          : result.sentiment === "NEUTRAL"
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <motion.div
          className="history-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="history-title">📋 Analysis History</div>
          {history.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center" }}>
              No history yet — analyze some text first!
            </p>
          ) : (
            <>
              {history.map((item, index) => (
                <div
                  key={index}
                  className={`history-item ${
                    item.sentiment === "POSITIVE"
                      ? "history-item-positive"
                      : item.sentiment === "NEUTRAL"
                      ? "history-item-neutral"
                      : "history-item-negative"
                  }`}
                >
                  <span className="history-text">{item.text}</span>
                  <span
                    className={`history-badge ${
                      item.sentiment === "POSITIVE"
                        ? "badge-positive"
                        : item.sentiment === "NEUTRAL"
                        ? "badge-neutral"
                        : "badge-negative"
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>
              ))}
              <button
                className="clear-btn"
                onClick={() => exportToCSV(history, "history.csv")}
              >
                ⬇️ Export CSV
              </button>
              <button
                className="clear-btn"
                onClick={() => setHistory([])}
              >
                <FiTrash2 style={{ marginRight: 6 }} />
                Clear History
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <motion.div
          style={{ width: "100%", maxWidth: 680 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="history-card">
            <div className="history-title">📊 Analytics Dashboard</div>

            {history.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center" }}>
                No data yet — analyze some text first!
              </p>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{history.length}</div>
                    <div className="stat-label">Total Analyzed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number" style={{ color: "#22c55e" }}>
                      {positiveCount}
                    </div>
                    <div className="stat-label">Positive</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number" style={{ color: "#ef4444" }}>
                      {negativeCount}
                    </div>
                    <div className="stat-label">Negative</div>
                  </div>
                </div>

                {/* Avg Confidence */}
                <div className="stat-card" style={{ marginBottom: 24 }}>
                  <div className="stat-number">{avgConfidence}%</div>
                  <div className="stat-label">Average Confidence</div>
                </div>

                {/* Pie Chart */}
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                    Sentiment Distribution
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        color: "#f8fafc",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </motion.div>
      )}
      {/* File Upload Tab */}
{activeTab === "file" && (
  <motion.div
    style={{ width: "100%", maxWidth: 680 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="card">
      <div
        className="upload-area"
        onClick={() => document.getElementById("fileInput").click()}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          Click to upload a <span>.txt file</span>
          <br />
          Every sentence will be analyzed automatically
        </div>
        <input
          id="fileInput"
          type="file"
          accept=".txt"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setFileLoading(true);
            setFileError(null);
            setFileResults(null);

            const formData = new FormData();
            formData.append("file", file);

            try {
              const response = await axios.post(
                "http://127.0.0.1:8000/predict-file",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
              );
              setFileResults(response.data);
            } catch (err) {
              setFileError("Something went wrong. Make sure your API is running!");
            } finally {
              setFileLoading(false);
            }
          }}
        />
      </div>

      {fileLoading && (
        <p style={{ textAlign: "center", color: "#94a3b8" }}>
          Analyzing file... ⏳
        </p>
      )}

      {fileError && (
        <div className="error-card">{fileError}</div>
      )}
    </div>

    {/* File Results */}
    {fileResults && (
      <motion.div
        className="history-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Summary */}
        <div className="file-summary">
          <div className="file-stat">
            <div className="file-stat-number">{fileResults.total}</div>
            <div className="file-stat-label">Total Sentences</div>
          </div>
          <div className="file-stat">
            <div
              className="file-stat-number"
              style={{ color: "#22c55e" }}
            >
              {fileResults.positive}
            </div>
            <div className="file-stat-label">Positive</div>
          </div>
          <div className="file-stat">
            <div
              className="file-stat-number"
              style={{ color: "#ef4444" }}
            >
              {fileResults.negative}
            </div>
            <div className="file-stat-label">Negative</div>
          </div>
        </div>

        {/* Sentence Results */}
        <div className="history-title">📝 Sentence Analysis</div>
        {fileResults.results.map((item, index) => (
          <div
            key={index}
            className={`sentence-result ${
              item.sentiment === "POSITIVE"
                ? "sentence-positive"
                : item.sentiment === "NEUTRAL"
                ? "sentence-neutral"
                : "sentence-negative"
            }`}
          >
            <span className="sentence-text">{item.text}</span>
            <div className="sentence-badge">
              <span
                className={`history-badge ${
                  item.sentiment === "POSITIVE"
                    ? "badge-positive"
                    : item.sentiment === "NEUTRAL"
                    ? "badge-neutral"
                    : "badge-negative"
                }`}
              >
                {item.sentiment}
              </span>
              <span className="sentence-confidence">
                {item.confidence}%
              </span>
            </div>
          </div>
        ))}
        <button
          className="clear-btn"
          onClick={() => exportToCSV(fileResults.results, "file-analysis.csv")}
        >
          ⬇️ Export CSV
        </button>
      </motion.div>
    )}
  </motion.div>
)}
{/* Paragraph Tab */}
{activeTab === "paragraph" && (
  <motion.div
    style={{ width: "100%", maxWidth: 680 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="card">
      <textarea
        placeholder="Paste a full paragraph here and each sentence will be analyzed separately..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
      />
      <div className="char-count">{text.length} characters</div>
      <button
        className="btn-primary"
        onClick={async () => {
          if (!text.trim()) return;
          setLoading(true);
          setResult(null);
          setError(null);
          try {
            const response = await axios.post(
              "http://127.0.0.1:8000/predict-paragraph",
              { text: text }
            );
            setResult(response.data);
          } catch (err) {
            setError("Something went wrong. Make sure your API is running!");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading || !text.trim()}
      >
        {loading ? "Analyzing... ⏳" : "Analyze Paragraph 📝"}
      </button>
    </div>

    {error && (
      <div className="error-card">⚠️ {error}</div>
    )}

    {result && result.results && (
      <motion.div
        className="history-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Summary */}
        <div className="file-summary">
          <div className="file-stat">
            <div className="file-stat-number">{result.total}</div>
            <div className="file-stat-label">Total Sentences</div>
          </div>
          <div className="file-stat">
            <div className="file-stat-number" style={{ color: "#22c55e" }}>
              {result.positive}
            </div>
            <div className="file-stat-label">Positive</div>
          </div>
          <div className="file-stat">
            <div className="file-stat-number" style={{ color: "#ef4444" }}>
              {result.negative}
            </div>
            <div className="file-stat-label">Negative</div>
          </div>
        </div>

        {/* Sentence Results */}
        <div className="history-title">📝 Sentence Breakdown</div>
        {result.results.map((item, index) => (
          <div
            key={index}
            className={`sentence-result ${
              item.sentiment === "POSITIVE"
                ? "sentence-positive"
                : item.sentiment === "NEUTRAL"
                ? "sentence-neutral"
                : "sentence-negative"
            }`}
          >
            <span className="sentence-text">{item.text}</span>
            <div className="sentence-badge">
              <span
                className={`history-badge ${
                  item.sentiment === "POSITIVE"
                    ? "badge-positive"
                    : item.sentiment === "NEUTRAL"
                    ? "badge-neutral"
                    : "badge-negative"
                }`}
              >
                {item.sentiment}
              </span>
              <span className="sentence-confidence">
                {item.confidence}%
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    )}
  </motion.div>
)}
{/* Groq Tab */}
{activeTab === "bert" && (
  <motion.div
    style={{ width: "100%", maxWidth: 680 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    {/* Info Card */}
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{
        background: "linear-gradient(135deg, #6366f1, #a855f7)",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 16
      }}>
        <h3 style={{ color: "white", margin: "0 0 6px 0" }}>
          🦙 Groq LLaMA3 Model
        </h3>
        <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.9rem" }}>
          Using Groq's LLaMA3 — an extremely powerful AI model.
          Understands context, sarcasm and complex sentences!
        </p>
      </div>

      <textarea
        placeholder="Type text to analyze with Groq LLaMA3..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
      />
      <div className="char-count">{text.length} characters</div>

      <button
        className="btn-primary"
        onClick={analyzeGroq}
        disabled={loading || !text.trim()}
      >
        {loading ? "Analyzing with Groq... ⏳" : "Analyze with Groq LLaMA3 🦙"}
      </button>
    </div>

    {error && (
      <motion.div
        className="error-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        ⚠️ {error}
      </motion.div>
    )}

    {result && !result.error && (
      <motion.div
        className={`result-card ${
          result.sentiment === "POSITIVE"
            ? "result-positive"
            : result.sentiment === "NEUTRAL"
            ? "result-neutral"
            : "result-negative"
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Groq Badge */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <span style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            color: "white",
            padding: "4px 16px",
            borderRadius: 999,
            fontSize: "0.8rem",
            fontWeight: 700
          }}>
            🦙 Powered by Groq LLaMA3
          </span>
        </div>

        <div className="result-title">
          {result.sentiment === "POSITIVE" ? (
            <span className="positive-text">✅ POSITIVE</span>
          ) : result.sentiment === "NEUTRAL" ? (
            <span className="neutral-text">⚪ NEUTRAL</span>
          ) : (
            <span className="negative-text">❌ NEGATIVE</span>
          )}
        </div>

        <p className="result-text">
          <strong style={{ color: "#f8fafc" }}>Text:</strong>{" "}
          {result.text}
        </p>

        <div className="confidence-label">
          Confidence: {result.confidence}%
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${result.confidence}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              backgroundColor:
                result.sentiment === "POSITIVE"
                  ? "#22c55e"
                  : result.sentiment === "NEUTRAL"
                  ? "#f59e0b"
                  : "#ef4444",
            }}
          />
        </div>

        {/* Compare with basic model */}
        <div style={{
          marginTop: 20,
          padding: 16,
          background: "#0f172a",
          borderRadius: 12,
          fontSize: "0.85rem",
          color: "#64748b"
        }}>
          💡 This result is powered by Groq LLaMA3 —
          much more accurate than basic ML models for complex sentences!
        </div>
      </motion.div>
    )}
  </motion.div>
)}
    </div>
  );
}


export default App;