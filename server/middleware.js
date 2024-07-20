import fetch from "node-fetch";
import express from "express";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

const googleDiscoveryUrl = process.env.GOOGLE_DISCOVERY_URL;
const microsoftDiscoveryUrl = process.env.MICROSOFT_DISCOVERY_URL;

async function fetchJson(url, params) {
  const res = await fetch(url, params);
  if (!res.ok) {
    return null;
  }
  return await res.json();
}

export async function userMiddleware(req, res, next) {
  const { username, access_token } = req.signedCookies;
  if (access_token) {
    const googleInfo = await fetchJson(googleDiscoveryUrl);
    const microsoftInfo = await fetchJson(microsoftDiscoveryUrl);

    if (googleInfo.userinfo_endpoint) {
      const user = await fetchJson(googleInfo.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (user) {
        const { given_name, family_name, email, picture } = user;
        const username = given_name?.charAt(0).toUpperCase() + given_name?.slice(1);
        const fullName = `${given_name?.charAt(0).toUpperCase() + given_name?.slice(1)} ${family_name?.charAt(0).toUpperCase() + family_name?.slice(1)}`;
        const mail = email;
        const photo = picture;
        req.user = { ...user, username, fullName, mail, photo };
      }
    }

    if (microsoftInfo.userinfo_endpoint) {
      const user = await fetchJson(microsoftInfo.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (user) {
        const { given_name, family_name, email, picture } = user;
        const username = given_name?.charAt(0).toUpperCase() + given_name?.slice(1).split(" ")[0];
        const fullName = `${given_name?.charAt(0).toUpperCase() + given_name?.slice(1)} ${family_name?.charAt(0).toUpperCase() + family_name?.slice(1)}`;
        const mail = email;
        const photo = picture;
        req.user = { ...user, username, fullName, mail, photo };
      }
    }
  }
  next();
}

export function serveClientApp(req, res, next) {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.resolve("../client/dist/index.html"));
  } else {
    next();
  }
}
