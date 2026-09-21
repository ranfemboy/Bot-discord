import axios from "axios";
import crypto from "crypto";

const CONFIG = {
  secretKeyHex:
    "34ac9a1aa6aaa7d69a7075611898f16a85d496b1d8f1c7aaa5640a2d93d7af80",
  appVersionTS: "1770240123231",
  userAgent:
    "Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.109 Mobile Safari/537.36",
};

const CORS_PROXY = "https://cors.yardansh.com/";

async function fastDLDownload(igUrl) {
  const isStory = igUrl.includes("/stories/");
  let cleanUrl = igUrl.split("?")[0];
  if (!cleanUrl.endsWith("/")) cleanUrl += "/";

  const homeRes = await axios.get(CORS_PROXY + "https://fastdl.app/id", {
    headers: { "User-Agent": CONFIG.userAgent },
  });
  const cookieStr = homeRes.headers["set-cookie"]
    ? homeRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
    : "";

  const msecRes = await axios.get(CORS_PROXY + "https://fastdl.app/msec", {
    headers: { "User-Agent": CONFIG.userAgent, Cookie: cookieStr },
  });
  const serverTime = Math.floor(msecRes.data.msec * 1000);
  const ts = serverTime - 450;

  const signatureSource = isStory
    ? JSON.stringify({ url: cleanUrl }) + ts
    : cleanUrl + ts;
  const signature = crypto
    .createHmac("sha256", Buffer.from(CONFIG.secretKeyHex, "hex"))
    .update(signatureSource)
    .digest("hex");

  let response;
  if (isStory) {
    response = await axios.post(
      CORS_PROXY + "https://api-wh.fastdl.app/api/v1/instagram/story",
      {
        url: cleanUrl,
        ts,
        _ts: CONFIG.appVersionTS,
        _tsc: 0,
        _sv: 2,
        _s: signature,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": CONFIG.userAgent,
          Origin: "https://fastdl.app",
          Referer: "https://fastdl.app/id/story-saver",
          Cookie: cookieStr,
        },
      },
    );
  } else {
    const params = new URLSearchParams();
    params.append("sf_url", cleanUrl);
    params.append("ts", ts);
    params.append("_ts", CONFIG.appVersionTS);
    params.append("_tsc", "0");
    params.append("_sv", "2");
    params.append("_s", signature);

    response = await axios.post(
      CORS_PROXY + "https://api-wh.fastdl.app/api/convert",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": CONFIG.userAgent,
          Origin: "https://fastdl.app",
          Referer: "https://fastdl.app/id",
          Cookie: cookieStr,
        },
      },
    );
  }
  return response.data;
}

function formatStoryResult(data) {
  const result = data.result[0];
  const media = [];
  if (result.video_versions?.length > 0)
    media.push({
      type: "video",
      url: result.video_versions[0].url_wrapped || result.video_versions[0].url,
    });
  if (result.image_versions2?.candidates?.length > 0)
    media.push({
      type: "image",
      url:
        result.image_versions2.candidates[0].url_wrapped ||
        result.image_versions2.candidates[0].url,
    });
  return {
    username: result.user?.username || "-",
    id: result.user?.id || "-",
    is_private: result.user?.is_private || false,
    profile_url: result.user?.profile_pic_url || "-",
    taken_at: result.taken_at || "-",
    media,
  };
}

function formatPostResult(data) {
  const isArray = Array.isArray(data);
  const firstItem = isArray ? data[0] : data;
  const media = [];
  if (isArray) {
    data.forEach((item) => {
      if (item.url?.length > 0)
        media.push({
          type: item.url[0].type || "-",
          url: item.url[0].url || item.hd || item.sd || "-",
        });
    });
  } else {
    if (data.url?.length > 0)
      media.push({
        type: data.url[0].type || "-",
        url: data.url[0].url || data.hd || data.sd || "-",
      });
  }
  const meta = firstItem.meta || null;
  return {
    title: meta?.title || "-",
    likes: meta?.like_count || "-",
    comment: meta?.comment_count || "-",
    username: meta?.username || "-",
    taken_at: meta?.taken_at || "-",
    thumbnail: firstItem.thumb || "-",
    media,
    comments: meta?.comments || [],
  };
}

async function instagramDownloader(url) {
  const data = await fastDLDownload(url);
  return url.includes("/stories/")
    ? formatStoryResult(data)
    : formatPostResult(data);
}

export default instagramDownloader;