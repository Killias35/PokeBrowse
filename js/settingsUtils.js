const defaultSettings = {
    username: "Dresseur",
    volGlobal: 1.0,
    volMusic: 1.0,
    volSfx: 1.0
};

export async function getVolumesParam() {
    if (!chrome.storage?.local) {
        console.error("chrome.storage.local indisponible");
        return;
    }
    const res = await chrome.storage.local.get(["volumes"]);
    if (!res.volumes) {
        return {
            globalVolume: defaultSettings.volGlobal,
            musicVolume: defaultSettings.volMusic,
            sfxVolume: defaultSettings.volSfx
        };
    }

    return res.volumes;
}

export async function getUsernameParam(){
    const res = await chrome.storage.local.get(["username"]);
    if (!res.username) return defaultSettings.username;
    return res.username;
}

export async function setVolumesParam(volumes){
    await chrome.storage.local.set({volumes});
}

export async function setUsernameParam(username){
    await chrome.storage.local.set({username});
}