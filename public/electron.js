const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const path = require("path")
const chokidar = require("chokidar")
const fs = require("fs")
const { OAuth2Client } = require("google-auth-library")
const { google } = require("googleapis")
const http = require("http")

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 880,
        minWidth: 896,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    })

    const isDev = !app.isPackaged

    if (isDev) {
        mainWindow.loadURL("http://localhost:3000")
    } else {
        mainWindow.loadFile(path.join(__dirname, "../build/index.html"))
    }
}

app.whenReady()
    .then(() => {
        createWindow()

        let watcher = null

        const CLIENT_ID =
            "971364475888-5k7cl68a5cj9401b3q6s76kmau5ivcvj.apps.googleusercontent.com"
        const CLIENT_SECRET = "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"

        const buildOAuthClient = (redirectUri) =>
            new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, redirectUri)

        ipcMain.on("start-watching", (event, { folder, bucket, tokens }) => {
            const oauth2Client = buildOAuthClient()
            oauth2Client.setCredentials(tokens)

            const storage = google.storage("v1")

            if (watcher) {
                watcher.close() // prevent multiple watchers
            }

            watcher = chokidar.watch(folder, { ignoreInitial: true })

            mainWindow.webContents.send(
                "upload-log",
                `👀 Watching folder: ${folder}`
            )

            watcher.on("add", (filePath) => {
                const fileName = path.basename(filePath)
                mainWindow.webContents.send(
                    "upload-log",
                    `📂 New file detected: ${fileName}`
                )

                setTimeout(async () => {
                    try {
                        await storage.objects.insert({
                            bucket,
                            name: fileName,
                            media: {
                                body: fs.createReadStream(filePath),
                            },
                            auth: oauth2Client,
                        })

                        mainWindow.webContents.send(
                            "upload-log",
                            `✅ Uploaded: ${fileName}`
                        )
                    } catch (err) {
                        console.error(err)
                        mainWindow.webContents.send(
                            "upload-log",
                            `❌ Failed (${
                                err.code || err.message
                            }): ${fileName}`
                        )
                    }
                }, 1000) // small delay to avoid locked files
            })
        })

        ipcMain.on("open-folder-dialog", async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
                properties: ["openDirectory"],
            })

            if (!result.canceled && result.filePaths.length > 0) {
                mainWindow.webContents.send(
                    "selected-folder",
                    result.filePaths[0]
                )
            }
        })

        ipcMain.handle("login-with-google", () => {
            return new Promise((resolve, reject) => {
                setImmediate(async () => {
                    try {
                        const port = Math.floor(Math.random() * 55533) + 10000
                        const redirectUri = `http://localhost:${port}/oauth2callback`
                        const oauth2Client = new OAuth2Client(
                            CLIENT_ID,
                            CLIENT_SECRET,
                            redirectUri
                        )

                        const authUrl = oauth2Client.generateAuthUrl({
                            access_type: "offline",
                            scope: [
                                "https://www.googleapis.com/auth/devstorage.read_write",
                                "https://www.googleapis.com/auth/cloud-platform.read-only",
                                "https://www.googleapis.com/auth/userinfo.email",
                            ],
                        })

                        await require("open").default(authUrl)

                        const server = http.createServer((req, res) => {
                            if (req.url.includes("/oauth2callback")) {
                                ;(async () => {
                                    try {
                                        const urlObj = new URL(
                                            req.url,
                                            redirectUri
                                        )
                                        const code =
                                            urlObj.searchParams.get("code")

                                        const { tokens } =
                                            await oauth2Client.getToken(code)
                                        oauth2Client.setCredentials(tokens)

                                        const { google } = require("googleapis")
                                        const oauth2 = google.oauth2({
                                            auth: oauth2Client,
                                            version: "v2",
                                        })
                                        const userInfo =
                                            await oauth2.userinfo.get()

                                        res.writeHead(200, {
                                            "Content-Type": "text/html",
                                        })
                                        res.end(
                                            "<h2>✅ You may now close this window.</h2>"
                                        )
                                        server.close()

                                        resolve({
                                            tokens,
                                            email: userInfo.data.email,
                                        })
                                    } catch (err) {
                                        console.error("OAuth error", err)
                                        if (!res.headersSent) {
                                            res.writeHead(500)
                                            res.end("OAuth failed")
                                        }
                                        server.close()
                                        reject(err)
                                    }
                                })()
                            }
                        })

                        server.listen(port)
                    } catch (err) {
                        reject(err)
                    }
                })
            })
        })

        ipcMain.handle("list-projects", async (event, tokens) => {
            const { google } = require("googleapis")
            const oauth2Client = buildOAuthClient()
            oauth2Client.setCredentials(tokens)

            const cloudResourceManager = google.cloudresourcemanager("v1")

            const res = await cloudResourceManager.projects.list({
                auth: oauth2Client,
            })

            const projects = res.data.projects || []
            return projects.map((p) => ({
                projectId: p.projectId,
                name: p.name,
            }))
        })

        ipcMain.handle("list-buckets", async (event, { tokens, projectId }) => {
            const { google } = require("googleapis")
            const oauth2Client = buildOAuthClient()
            oauth2Client.setCredentials(tokens)

            const storage = google.storage("v1")

            const res = await storage.buckets.list({
                auth: oauth2Client,
                project: projectId,
            })

            return res.data.items?.map((b) => b.name) || []
        })
    })
    .catch((error) => {
        console.log(error)
    })
