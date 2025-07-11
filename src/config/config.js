module.exports = {
    appName: 'Mira IPTV Player Bridge',
    projectUrl: 'https://github.com/yusufkarakehya/iptv-mira-tray',
    apiHost: "https://dev.karakehya.com",
    apiPath: "/rest/miraiptv/api/control",
    allowedOrigins: [
        "http://localhost:3333",
        "http://127.0.0.1:3333",
        "https://app.karakehya.com",
        "https://www.app.karakehya.com",
        "https://miraiptvplayer.com",
        "https://www.miraiptvplayer.com"
    ],
    serverPort: 37373,
    vlcUrl: 'https://www.videolan.org/vlc/',
    devMode: process.env.DEBUG === 'true'
};
