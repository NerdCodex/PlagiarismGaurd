import React, { useState, useRef } from "react";
import Scanner from "./Scanner";
import { supabase } from "../supabaseClient";

function Toast({ message, type }) {
  return <div className={`toast toast-${type}`}>{message}</div>;
}

function Home() {
  const [scanning, setScanning] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [exists, setExists] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileInputRef = useRef(null);
  const scanProcessedRef = useRef(false);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleScanResult = async (text) => {
    // Prevent duplicate scan callbacks from the barcode scanner
    if (scanProcessedRef.current) return;
    scanProcessedRef.current = true;

    setScanning(false);
    setChecking(true);

    if (!text.startsWith("23UCA")) {
      showToast("Invalid barcode — must start with 23UCA", "error");
      setChecking(false);
      scanProcessedRef.current = false;
      return;
    }

    setRollNumber(text);

    try {
      // Use .maybeSingle() — returns null data (no error) when 0 rows,
      // and returns the row when exactly 1 row is found
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("roll_number", text)
        .maybeSingle();

      if (error) {
        console.error("Supabase lookup error:", error);
        showToast("Error checking database: " + error.message, "error");
        setChecking(false);
        scanProcessedRef.current = false;
        return;
      }

      if (data) {
        setName(data.name || "");
        setTitle(data.title || "");
        setExistingFileUrl(data.file_url || "");
        setExists(true);
        showToast("Existing record found — you can edit", "success");
      } else {
        setExists(false);
        setName("");
        setTitle("");
        setExistingFileUrl("");
        showToast("New student — fill in your details", "info");
      }

      setFormVisible(true);
    } catch (err) {
      console.error("Scan lookup failed:", err);
      showToast("Failed to look up record", "error");
    }
    setChecking(false);
    scanProcessedRef.current = false;
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
    } else {
      showToast("Only PDF files are allowed", "error");
      e.target.value = null;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
    } else {
      showToast("Only PDF files are allowed", "error");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !title.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }
    if (!exists && !file) {
      showToast("Please upload a PDF report", "error");
      return;
    }

    setLoading(true);
    try {
      let fileUrl = existingFileUrl;

      if (file) {
        const fileName = `${rollNumber}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("reports")
          .upload(fileName, file, { upsert: true });

        if (uploadErr) {
          showToast("Error uploading file: " + uploadErr.message, "error");
          setLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("reports")
          .getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }

      if (exists) {
        const { error } = await supabase
          .from("students")
          .update({
            name: name.trim(),
            title: title.trim(),
            ...(fileUrl && { file_url: fileUrl }),
            updated_at: new Date().toISOString(),
          })
          .eq("roll_number", rollNumber);

        if (error) {
          showToast("Error updating: " + error.message, "error");
        } else {
          showToast("Updated successfully!", "success");
          // Add cache-buster so browser fetches the new PDF
          const bustUrl = fileUrl ? fileUrl.split('?')[0] + '?t=' + Date.now() : fileUrl;
          setExistingFileUrl(bustUrl);
        }
      } else {
        // Use upsert to handle edge case where record exists but wasn't detected
        const { error } = await supabase.from("students").upsert({
          roll_number: rollNumber,
          name: name.trim(),
          title: title.trim(),
          file_url: fileUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: "roll_number" });

        if (error) {
          showToast("Error submitting: " + error.message, "error");
        } else {
          showToast("Submitted successfully!", "success");
          setExists(true);
          const bustUrl = fileUrl ? fileUrl.split('?')[0] + '?t=' + Date.now() : fileUrl;
          setExistingFileUrl(bustUrl);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Unexpected error occurred", "error");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormVisible(false);
    setRollNumber("");
    setName("");
    setTitle("");
    setFile(null);
    setExists(false);
    setExistingFileUrl("");
    scanProcessedRef.current = false;
  };

  return (
    <div className="page-container">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>

      {/* Idle state: scan button */}
      {!scanning && !formVisible && !checking && (
        <div className="scan-hero">
          <h1 className="title">Plagiarism Report Submission</h1>
          <p className="subtitle">Scan your student ID barcode to get started</p>
          <div className="scan-btn-wrapper">
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <button
              className="scan-btn"
              id="scan-barcode-btn"
              onClick={() => setScanning(true)}
              title="Scan Barcode"
            >
              📷
            </button>
          </div>
          <p className="subtitle" style={{ marginTop: 8, fontSize: "0.85rem" }}>
            Tap to open camera
          </p>
        </div>
      )}

      {/* Checking state */}
      {checking && (
        <div className="scan-hero">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p className="subtitle">Looking up your record…</p>
        </div>
      )}

      {/* Scanner overlay */}
      {scanning && (
        <Scanner
          onScan={handleScanResult}
          onClose={() => setScanning(false)}
        />
      )}

      {/* Form */}
      {formVisible && (
        <div className="glass-card form-card">
          <div className="form-header">
            <h2 className="form-title">
              {exists ? "Edit Submission" : "New Submission"}
            </h2>
            <span className={`badge ${exists ? "badge-success" : "badge-accent"}`}>
              {exists ? "✓ Existing" : "★ New"}
            </span>
          </div>

          <div className="form-group">
            <label className="input-label">Roll Number</label>
            <div className="badge badge-accent" style={{ fontSize: "0.95rem", padding: "8px 18px" }}>
              {rollNumber}
            </div>
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="student-name">Name</label>
            <input
              id="student-name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="project-title">Project Title</label>
            <input
              id="project-title"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your project title"
            />
          </div>

          <div className="form-group">
            <label className="input-label">
              PDF Report {exists && "(re-upload to replace)"}
            </label>
            <div
              className={`file-drop-zone ${dragOver ? "dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="icon">📄</div>
              <div className="label">
                {file ? (
                  <strong>{file.name}</strong>
                ) : (
                  <>Drag & drop PDF here or <strong>browse</strong></>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {exists && existingFileUrl && (
            <div className="form-group">
              <a
                href={existingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                📑 View Current Report
              </a>
            </div>
          )}

          <div className="form-actions">
            <button className="btn-outline" onClick={resetForm}>
              ← Scan Another
            </button>
            <button
              className="btn-accent"
              id="submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : exists ? (
                "Update"
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;