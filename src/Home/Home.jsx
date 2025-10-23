import React, { useState, useEffect } from "react"

const Home = () => {
    const [folder, setFolder] = useState("")
    const [bucket, setBucket] = useState("")
    const [logs, setLogs] = useState([])
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [buckets, setBuckets] = useState([])
    const [selectedBucket, setSelectedBucket] = useState("")
    const [tokens, setTokens] = useState(null)

    const handleLogin = async () => {
        const result = await window.electronAPI.loginWithGoogle()
        setLogs((prev) => [...prev, "✅ Logged in with Google"])

        setProjects(result.projects)
        setTokens(result.tokens)
    }

    const startWatching = () => {
        if (!folder || !bucket)
            return alert("please enter folder and bucket name")

        window.electronAPI?.startWatching({ folder, bucket })
    }

    useEffect(() => {
        window.electronAPI?.onUploadLog((msg) =>
            setLogs((prev) => [...prev, msg])
        )

        window.electronAPI?.onFolderSelected((selectedPath) => {
            setFolder(selectedPath)
        })
    }, [])

    useEffect(() => {
        const loadBuckets = async () => {
            if (tokens && selectedProject) {
                const result = await window.electronAPI.listBuckets({
                    tokens,
                    projectId: selectedProject,
                })
                setBuckets(result)
                setLogs((prev) => [
                    ...prev,
                    `🪣 Found ${result.length} buckets`,
                ])
            }
        }

        loadBuckets()
    }, [selectedProject])

    return (
        <div className="home">
            <h1>bucket sync</h1>

            <button onClick={handleLogin}>sign in with google</button>

            {projects.length > 0 && (
                <div>
                    <label>Select Project:</label>
                    <select
                        value={selectedProject || ""}
                        onChange={(e) => setSelectedProject(e.target.value)}
                    >
                        <option disabled value="">
                            -- choose a project --
                        </option>
                        {projects.map((proj) => (
                            <option key={proj.projectId} value={proj.projectId}>
                                {proj.name} ({proj.projectId})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {buckets.length > 0 && (
                <div>
                    <label>Select Bucket:</label>
                    <select
                        value={selectedBucket}
                        onChange={(e) => setSelectedBucket(e.target.value)}
                    >
                        <option disabled value="">
                            -- choose a bucket --
                        </option>
                        {buckets.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label>folder</label>
                <input
                    type="text"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="C:/your/folder/path"
                />
                <button onClick={() => window.electronAPI.openFolderDialog()}>
                    browse
                </button>
            </div>

            <button onClick={startWatching}>start</button>

            <div>
                <h2>logs</h2>
                <ul>
                    {logs.map((log, i) => (
                        <li key={i}>{log}</li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default Home
