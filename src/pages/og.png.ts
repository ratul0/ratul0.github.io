import type { APIRoute } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { siteConfig } from "../config";

export const GET: APIRoute = async () => {
  const root = process.cwd();
  const fontPath = (weight: number) =>
    join(root, `node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${weight}-normal.woff`);

  // Load fonts and convert profile image in parallel
  const [fontRegular, fontMedium, fontBold, profilePng] = await Promise.all([
    readFileSync(fontPath(400)),
    readFileSync(fontPath(500)),
    readFileSync(fontPath(700)),
    sharp(join(root, `public${siteConfig.profileImage}`))
      .resize(160, 160)
      .png()
      .toBuffer(),
  ]);
  const profileDataUri = `data:image/png;base64,${profilePng.toString("base64")}`;

  const [firstName, ...lastParts] = siteConfig.name.split(" ");
  const lastName = lastParts.join(" ");
  const skills = siteConfig.skills.slice(0, 7);

  // Design tokens
  const bg = "#060609";
  const textPrimary = "#eaeaea";
  const textSecondary = "#8b949e";
  const teal = "#5cbcd0";
  const border = "#1e2430";
  const watermark = "#3b4048";

  const nameStyle = {
    fontSize: "52px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "-0.02em",
    lineHeight: 1.0,
  };

  const markup = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "1200px",
        height: "630px",
        padding: "0px 80px",
        backgroundColor: bg,
        backgroundImage:
          "radial-gradient(ellipse at 75% 25%, rgba(92,188,208,0.06), transparent 60%)",
        fontFamily: "IBM Plex Mono",
        position: "relative",
      },
      children: [
        // Top row: photo + text block (with accent line inside)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "48px",
            },
            children: [
              // Profile photo with bezel frame
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    padding: "6px",
                    border: `1px solid ${border}`,
                    borderRadius: "18px",
                    flexShrink: 0,
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: profileDataUri,
                        width: 160,
                        height: 160,
                        style: {
                          borderRadius: "14px",
                          border: `3px solid ${border}`,
                        },
                      },
                    },
                  ],
                },
              },
              // Text block: eyebrow + name + accent line
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  },
                  children: [
                    // Name block
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          lineHeight: 1.0,
                        },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: { ...nameStyle, color: textPrimary },
                              children: firstName,
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { ...nameStyle, color: teal, marginLeft: "48px" },
                              children: lastName,
                            },
                          },
                        ],
                      },
                    },
                    // Title pill (below name, centered)
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          justifyContent: "center",
                          marginTop: "4px",
                        },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: "11px",
                                fontWeight: 500,
                                textTransform: "uppercase",
                                letterSpacing: "0.2em",
                                color: textSecondary,
                                border: `1px solid ${border}`,
                                borderRadius: "9999px",
                                padding: "5px 14px",
                              },
                              children: siteConfig.title.toUpperCase(),
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Description
        {
          type: "p",
          props: {
            style: {
              fontSize: "15px",
              fontWeight: 400,
              color: textSecondary,
              lineHeight: 1.5,
              marginTop: "36px",
              textAlign: "center",
            },
            children: siteConfig.description,
          },
        },
        // Skill pills
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "10px",
              marginTop: "32px",
            },
            children: skills.map((skill) => ({
              type: "span",
              props: {
                style: {
                  fontSize: "13px",
                  fontWeight: 400,
                  color: textSecondary,
                  border: `1px solid ${border}`,
                  borderRadius: "6px",
                  padding: "6px 14px",
                },
                children: skill,
              },
            })),
          },
        },
        // URL watermark (bottom-right)
        {
          type: "span",
          props: {
            style: {
              position: "absolute",
              bottom: "32px",
              right: "48px",
              fontSize: "12px",
              fontWeight: 400,
              color: watermark,
            },
            children: "ratul0.github.io",
          },
        },
      ],
    },
  };

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "IBM Plex Mono",
        data: fontRegular,
        weight: 400,
        style: "normal",
      },
      {
        name: "IBM Plex Mono",
        data: fontMedium,
        weight: 500,
        style: "normal",
      },
      {
        name: "IBM Plex Mono",
        data: fontBold,
        weight: 700,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const pngBuffer = resvg.render().asPng();

  return new Response(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
