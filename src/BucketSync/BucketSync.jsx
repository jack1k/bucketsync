import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Fa1, Fa2, Fa3, Fa4, Fa5, FaArrowRight } from "react-icons/fa6"
import GoogleIcon from "../Assets/Google.png"
import "./BucketSync.scss"

const steps = [
    { Icon: Fa1, text: "Sign in with Google" },
    { Icon: Fa2, text: "Select Google Cloud project" },
    { Icon: Fa3, text: "Select storage bucket" },
    { Icon: Fa4, text: "Select folder to upload from" },
    { Icon: Fa5, text: "Sync folder to cloud" },
]

const Message = () => {
    return <div className="message"></div>
}

const Google = ({ email, login, next }) => {
    return (
        <div className="google">
            <div className="google__head">
                <h1>Sign in</h1>
            </div>
            <div className="google__body">
                {email ? (
                    <>
                        <p>You're signed in as {email}</p>
                    </>
                ) : (
                    <button onClick={() => login()} className="google__sign-in">
                        <img src={GoogleIcon} alt="" />
                        <span>Sign in with Google</span>
                    </button>
                )}
            </div>
        </div>
    )
}

const Project = ({
    projectList,
    setSelectedProject,
    selectedProject,
    next,
}) => {
    return (
        <div className="project">
            <div className="project__head">
                <h1>Select a project</h1>
            </div>
            <div className="project__list">
                {projectList.map(({ name, projectId }) => (
                    <p
                        className={
                            projectId == selectedProject ? "active" : "inactive"
                        }
                        onClick={() => {
                            setSelectedProject(projectId)
                            next()
                        }}
                    >
                        {name} ({projectId})
                    </p>
                ))}
            </div>
        </div>
    )
}

const Bucket = ({ bucketList, setSelectedBucket, selectedBucket, next }) => {
    return (
        <div className="bucket">
            <div className="bucket__head">
                <h1>Select a bucket</h1>
            </div>
            <div className="bucket__list">
                {bucketList.map((bucket) => (
                    <p
                        className={
                            bucket == selectedBucket ? "active" : "inactive"
                        }
                        onClick={() => {
                            setSelectedBucket(bucket)
                            next()
                        }}
                    >
                        {bucket}
                    </p>
                ))}
            </div>
        </div>
    )
}

const Folder = ({ folder, selectFolder, next }) => {
    return (
        <div className="folder">
            <div className="folder__head">
                <h1>Select a folder</h1>
            </div>
            <div className="folder__body">
                <label>
                    <input
                        type="text"
                        placeholder="C:/your-folder"
                        value={folder}
                        onChange={(e) => setFolder(e.target.value)}
                    />
                    <button
                        onClick={() => window.electronAPI.openFolderDialog()}
                    >
                        Browse
                    </button>
                </label>
                <button onClick={next}>
                    Next <FaArrowRight />
                </button>
            </div>
        </div>
    )
}

const Yippee = ({ folder, bucket, tokens, onStart, logs, clearLogs }) => {
    useEffect(() => {
        if (folder && bucket && tokens) {
            window.electronAPI.startWatching({ folder, bucket, tokens })
        }
    }, [])

    return (
        <div className="yippee">
            <div className="yippee__head">
                <h1>Syncing folder to cloud</h1>
                <p>Keep this page open</p>
            </div>
            <div className="yippee__body">
                <div className="yippee__logs">
                    {logs.map((log) => (
                        <p>{log}</p>
                    ))}
                </div>
                <button onClick={clearLogs}>Clear logs</button>
            </div>
        </div>
    )
}

const BucketSync = () => {
    const [step, setStep] = useState(0)
    const [email, setEmail] = useState("")
    const [tokens, setTokens] = useState(null)
    const [projectList, setProjectList] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [bucketList, setBucketList] = useState([])
    const [selectedBucket, setSelectedBucket] = useState(null)
    const [folder, setFolder] = useState("")
    const [errors, setErrors] = useState([])
    const [logs, setLogs] = useState([])

    const next = () => setStep((prev) => prev + 1)

    const clearLogs = () => setLogs([])

    const login = async () => {
        const result = await window.electronAPI.login()

        setTokens(result.tokens)
        setEmail(result.email)
        setStep(1)
    }

    const listProjects = async () => {
        if (tokens) {
            const projects = await window.electronAPI.listProjects(tokens)
            setProjectList(projects)
        }
    }

    const listBuckets = async () => {
        if (tokens && selectedProject) {
            const result = await window.electronAPI.listBuckets({
                tokens,
                projectId: selectedProject,
            })
            setBucketList(result)
        }
    }

    const selectFolder = () => {}

    useEffect(() => {
        listProjects()
    }, [tokens])

    useEffect(() => {
        listBuckets()
    }, [tokens, selectedProject])

    useEffect(() => {
        window.electronAPI?.onUploadLog((msg) =>
            setLogs((prev) => [...prev, msg])
        )

        window.electronAPI?.onFolderSelected((selectedPath) => {
            setFolder(selectedPath)
        })
    }, [])

    return (
        <div className="bucket-sync">
            <div className="bucket-sync__bucket-sync">
                <div className="bucket-sync__progress">
                    {steps.map(({ Icon, text }, i) => (
                        <div
                            onClick={() => setStep(i)}
                            className={i <= step ? "active" : "inactive"}
                            key={i}
                        >
                            <div className="icon" key={i}>
                                <Icon />
                            </div>
                            <p>{text}</p>
                        </div>
                    ))}
                </div>
                <div className="bucket-sync__body">
                    {step == 0 && <Google {...{ email, login, next }} />}
                    {step == 1 && (
                        <Project
                            {...{
                                projectList,
                                setSelectedProject,
                                selectedProject,
                                next,
                            }}
                        />
                    )}
                    {step == 2 && (
                        <Bucket
                            {...{
                                bucketList,
                                setSelectedBucket,
                                selectedBucket,
                                next,
                            }}
                        />
                    )}
                    {step == 3 && (
                        <Folder {...{ folder, selectFolder, next }} />
                    )}
                    {step == 4 && (
                        <Yippee
                            {...{
                                folder,
                                bucket: selectedBucket,
                                tokens,
                                logs,
                                clearLogs,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default BucketSync
