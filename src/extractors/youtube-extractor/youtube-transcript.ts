//source: https://github.com/Kakulukian/youtube-transcript
import { request } from "obsidian";

const RE_YOUTUBE =
	/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/im;

export class YoutubeTranscriptError extends Error {
	constructor(message) {
		super(`[YoutubeTranscript] 🚨 ${message}`);
	}
}

export interface TranscriptConfig {
	lang?: string;
	country?: string;
}
export interface TranscriptResponse {
	text: string;
	duration: number;
	offset: number;
}

/**
 * Class to retrieve transcript if exist
 */
export class YoutubeTranscript {
	/**
	 * Fetch transcript from YTB Video
	 * @param videoId Video url or video identifier
	 * @param config Get transcript in another country and language ISO
	 */
	public static async fetchTranscript(
		videoId: string,
		config?: TranscriptConfig
	): Promise<TranscriptResponse[]> {
		const identifier = this.retrieveVideoId(videoId);
		try {
			const videoPageBody = await request(
				`https://www.youtube.com/watch?v=${identifier}`
			);
			const innerTubeApiKey = videoPageBody
				.toString()
				.split('"INNERTUBE_API_KEY":"')[1]
				.split('"')[0];
			if (innerTubeApiKey && innerTubeApiKey.length > 0) {
				const body = await request({
					url: `https://www.youtube.com/youtubei/v1/get_transcript?key=${innerTubeApiKey}`,
					method: "POST",
					body: JSON.stringify(
						this.generateRequest(videoPageBody.toString(), config)
					),
					headers: {
						"Content-Type": "application/json",
					},
				}).then((r) => JSON.parse(r));

				if (body.responseContext) {
					if (!body.actions) {
						throw new Error("Transcript is disabled on this video");
					}
					const transcripts =
						body.actions[0].updateEngagementPanelAction.content
							.transcriptRenderer.body.transcriptBodyRenderer
							.cueGroups;

					return transcripts.map((cue) => ({
						text: cue.transcriptCueGroupRenderer.cues[0]
							.transcriptCueRenderer.cue.simpleText,
						duration: parseInt(
							cue.transcriptCueGroupRenderer.cues[0]
								.transcriptCueRenderer.durationMs
						),
						offset: parseInt(
							cue.transcriptCueGroupRenderer.cues[0]
								.transcriptCueRenderer.startOffsetMs
						),
					}));
				}
			}
		} catch (e) {
			throw new YoutubeTranscriptError(e);
		}
	}

	/**
	 * Generate tracking params for YTB API
	 * @param page
	 * @param config
	 */
	private static generateRequest(page: string, config?: TranscriptConfig) {
		const params = page
			.split('"serializedShareEntity":"')[1]
			?.split('"')[0];
		const visitorData = page.split('"VISITOR_DATA":"')[1]?.split('"')[0];
		const sessionId = page.split('"sessionId":"')[1]?.split('"')[0];
		const clickTrackingParams = page
			?.split('"clickTrackingParams":"')[1]
			?.split('"')[0];
		return {
			context: {
				client: {
					hl: config?.lang || "fr",
					gl: config?.country || "FR",
					visitorData,
					userAgent:
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)",
					clientName: "WEB",
					clientVersion: "2.20200925.01.00",
					osName: "Macintosh",
					osVersion: "10_15_4",
					browserName: "Chrome",
					browserVersion: "85.0f.4183.83",
					screenWidthPoints: 1440,
					screenHeightPoints: 770,
					screenPixelDensity: 2,
					utcOffsetMinutes: 120,
					userInterfaceTheme: "USER_INTERFACE_THEME_LIGHT",
					connectionType: "CONN_CELLULAR_3G",
				},
				request: {
					sessionId,
					internalExperimentFlags: [],
					consistencyTokenJars: [],
				},
				user: {},
				clientScreenNonce: this.generateNonce(),
				clickTracking: {
					clickTrackingParams,
				},
			},
			params,
		};
	}

	/**
	 *  'base.js' function
	 */
	private static generateNonce() {
		const rnd = Math.random().toString();
		const alphabet =
			"ABCDEFGHIJKLMOPQRSTUVWXYZabcdefghjijklmnopqrstuvwxyz0123456789";
		const jda = [
			alphabet + "+/=",
			alphabet + "+/",
			alphabet + "-_=",
			alphabet + "-_.",
			alphabet + "-_",
		];
		const b = jda[3];
		const a = [];
		for (let i = 0; i < rnd.length - 1; i++) {
			a.push(rnd[i].charCodeAt(i));
		}
		let c = "";
		let d = 0;
		let m, n, q, r, f, g;
		while (d < a.length) {
			f = a[d];
			g = d + 1 < a.length;

			if (g) {
				m = a[d + 1];
			} else {
				m = 0;
			}
			n = d + 2 < a.length;
			if (n) {
				q = a[d + 2];
			} else {
				q = 0;
			}
			r = f >> 2;
			f = ((f & 3) << 4) | (m >> 4);
			m = ((m & 15) << 2) | (q >> 6);
			q &= 63;
			if (!n) {
				q = 64;
				if (!q) {
					m = 64;
				}
			}
			c += b[r] + b[f] + b[m] + b[q];
			d += 3;
		}
		return c;
	}

	/**
	 * Retrieve video id from url or string
	 * @param videoId video url or video id
	 */
	private static retrieveVideoId(videoId: string) {
		if (videoId.length === 11) {
			return videoId;
		}
		const matchId = videoId.match(RE_YOUTUBE);
		if (matchId && matchId.length) {
			return matchId[1];
		}
		throw new YoutubeTranscriptError(
			"Impossible to retrieve Youtube video ID."
		);
	}
}
