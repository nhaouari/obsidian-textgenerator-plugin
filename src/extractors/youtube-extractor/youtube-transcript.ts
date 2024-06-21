//source: https://github.com/Kakulukian/youtube-transcript
import { request } from "obsidian";

const RE_YOUTUBE =
  /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/im;

const RE_XML_TRANSCRIPT =
  /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;

export class YoutubeTranscriptError extends Error {
  constructor(message: string) {
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
  ): Promise<TranscriptResponse[] | undefined> {
    const identifier = this.retrieveVideoId(videoId);
    try {
      const videoPageBody = await request(
        `https://www.youtube.com/watch?v=${identifier}`
      );
      const splittedHTML = videoPageBody.split('"captions":');

      if (splittedHTML.length <= 1) {
        if (videoPageBody.includes('class="g-recaptcha"')) {
          throw new Error("Captcha detected, please try again later.");
        }
        if (!videoPageBody.includes('"playabilityStatus":')) {
          throw new Error("Video not found or private.");
        }
        throw new Error("Transcript is disabled on this video");
      }

      const detail = JSON.parse(
        splittedHTML[1].split(',"videoDetails')[0].replace('\n', '')
      ) as any;
  
      const captions = detail?.['playerCaptionsTracklistRenderer']
  
      if (!captions) {
        throw new Error("Transcript is disabled on this video");
      }
  
      if (!('captionTracks' in captions)) {
        throw new Error("Transcript is disabled on this video");
      }
  
      if (
        config?.lang &&
        !captions.captionTracks.some(
          (track: { languageCode: string | undefined; }) => track.languageCode === config?.lang
        )
      ) {
        throw new Error("Transcript is disabled on this video");
      }
  
      const transcriptURL = (
        config?.lang
          ? captions.captionTracks.find(
              (track: { languageCode: string | undefined; }) => track.languageCode === config?.lang
            )
          : captions.captionTracks[0]
      ).baseUrl;
  
      const transcriptBody = await request(transcriptURL);
      const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];
      return results.map((result) => ({
        text: result[3],
        duration: parseFloat(result[2]),
        offset: parseFloat(result[1]),
        lang: config?.lang ? config.lang : captions.captionTracks[0].languageCode,
      }));
    } catch (e) {
      throw new YoutubeTranscriptError(e);
    }
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
      'Impossible to retrieve Youtube video ID.'
    );
  }
}
