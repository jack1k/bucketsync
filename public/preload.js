const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
    startWatching: (data) => ipcRenderer.send("start-watching", data),
    onUploadLog: (callback) =>
        ipcRenderer.on("upload-log", (_, message) => callback(message)),

    openFolderDialog: () => ipcRenderer.send("open-folder-dialog"),
    onFolderSelected: (callback) =>
        ipcRenderer.on("selected-folder", (_, folderPath) =>
            callback(folderPath)
        ),

    // loginWithGoogle: () => ipcRenderer.invoke("login-with-google"),

    login: () => ipcRenderer.invoke("login-with-google"),
    listProjects: (tokens) => ipcRenderer.invoke("list-projects", tokens),
    listBuckets: (data) => ipcRenderer.invoke("list-buckets", data),
})
