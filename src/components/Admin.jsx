import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function Admin() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Auth guard + Fetch all students
  useEffect(() => {
    if (sessionStorage.getItem("adminAuth") !== "true") {
      navigate("/admin/login");
      return;
    }

    const fetchStudents = async () => {
      setLoadingData(true);
      try {
        console.log("Fetching students from Supabase...");
        const { data, error } = await supabase
          .from("students")
          .select("*");

        console.log("Supabase response - data:", data, "error:", error);

        if (error) {
          showToast("Error fetching data: " + error.message, "error");
          console.error("Supabase fetch error:", error);
        } else {
          // Sort client-side to avoid issues with null updated_at
          const sorted = (data || []).sort((a, b) => {
            const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0);
            const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0);
            return dateB - dateA;
          });
          setStudents(sorted);
          setFiltered(sorted);
          console.log("Loaded", sorted.length, "student records");
        }
      } catch (err) {
        console.error("Fetch students failed:", err);
        showToast("Failed to load student data", "error");
      }
      setLoadingData(false);
    };

    fetchStudents();
  }, [navigate]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(students);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        students.filter(
          (s) =>
            s.roll_number?.toLowerCase().includes(q) ||
            s.name?.toLowerCase().includes(q) ||
            s.title?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, students]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  const handleDownloadZip = async () => {
    const reportsToDownload = students.filter((s) => s.file_url);
    if (reportsToDownload.length === 0) {
      showToast("No reports to download", "error");
      return;
    }

    setDownloading(true);
    showToast("Preparing ZIP file…", "info");

    try {
      const zip = new JSZip();

      const promises = reportsToDownload.map(async (student) => {
        try {
          const response = await fetch(student.file_url);
          if (!response.ok) throw new Error("Failed to fetch");
          const blob = await response.blob();
          const fileName = `${student.roll_number}_${student.name?.replace(/\s+/g, "_") || "report"}.pdf`;
          zip.file(fileName, blob);
        } catch (err) {
          console.warn(`Failed to download report for ${student.roll_number}:`, err);
        }
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `plagiarism_reports_${new Date().toISOString().slice(0, 10)}.zip`);
      showToast("ZIP downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error creating ZIP file", "error");
    }
    setDownloading(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalReports = students.filter((s) => s.file_url).length;

  if (sessionStorage.getItem("adminAuth") !== "true") return null;

  return (
    <div className="page-container">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </div>

      <div className="admin-container">
        {/* Stats */}
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-value">{students.length}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalReports}</div>
            <div className="stat-label">Reports Uploaded</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{students.length - totalReports}</div>
            <div className="stat-label">Missing Reports</div>
          </div>
        </div>

        {/* Header */}
        <div className="admin-header">
          <h1>📊 Admin Dashboard</h1>
          <div className="admin-toolbar">
            <input
              id="admin-search"
              className="search-input"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="btn-accent btn-sm"
              id="download-zip-btn"
              onClick={handleDownloadZip}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />{" "}
                  Zipping…
                </>
              ) : (
                "📦 Download ZIP"
              )}
            </button>
            <button className="btn-danger btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card table-wrapper">
          {loadingData ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p style={{ marginTop: 16 }}>Loading data…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <p>{search ? "No matching records found" : "No student records yet"}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Project Title</th>
                  <th>Report</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => (
                  <tr key={student.roll_number || index}>
                    <td style={{ color: "var(--text-muted)" }}>{index + 1}</td>
                    <td>
                      <span className="badge badge-accent">
                        {student.roll_number}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{student.name || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {student.title || "—"}
                    </td>
                    <td>
                      {student.file_url ? (
                        <a
                          href={student.file_url.split('?')[0] + '?t=' + Date.now()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline btn-sm"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            textDecoration: "none",
                          }}
                        >
                          📄 View
                        </a>
                      ) : (
                        <span className="badge badge-warning">No report</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {formatDate(student.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;