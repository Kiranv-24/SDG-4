import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execPromise = promisify(exec);

/**
 * Get the duration of a video file in seconds using ffprobe
 * @param {string} filePath - Path to the video file
 * @returns {Promise<number>} - Duration in seconds
 */
export const getVideoDuration = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // First try with ffprobe if available
    try {
      const { stdout } = await execPromise(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
      );
      
      const duration = parseFloat(stdout.trim());
      return isNaN(duration) ? 0 : duration;
    } catch (ffprobeError) {
      console.warn('ffprobe not available or failed:', ffprobeError.message);
      
      // Fallback to approximate duration based on file size
      // This is a very rough estimate and not accurate
      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
      
      // Rough estimate: 1MB ≈ 8 seconds of video (for medium quality)
      // This varies greatly depending on encoding, resolution, etc.
      return fileSizeInMB * 8;
    }
  } catch (error) {
    console.error('Error getting video duration:', error);
    return 0;
  }
};

/**
 * Generate a thumbnail from a video file
 * @param {string} videoPath - Path to the video file
 * @param {string} outputPath - Path to save the thumbnail
 * @param {number} timeOffset - Time offset in seconds for the thumbnail
 * @returns {Promise<boolean>} - Success or failure
 */
export const generateThumbnail = async (videoPath, outputPath, timeOffset = 5) => {
  try {
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file does not exist: ${videoPath}`);
    }

    // Try to generate thumbnail with ffmpeg if available
    try {
      await execPromise(
        `ffmpeg -i "${videoPath}" -ss ${timeOffset} -vframes 1 -q:v 2 "${outputPath}" -y`
      );
      return fs.existsSync(outputPath);
    } catch (ffmpegError) {
      console.warn('ffmpeg not available or failed:', ffmpegError.message);
      return false;
    }
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return false;
  }
}; 