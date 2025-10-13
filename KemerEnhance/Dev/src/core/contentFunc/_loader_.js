import LinkBeautifyFactory from './LinkBeautify.js';
import VideoBeautify from './VideoBeautify.js';
import OriginalImageFactory from './OriginalImage.js';
import ExtraButtonFactory from './ExtraButton.js';
import CommentFormat from './CommentFormat.js';

const contentLoader = {
    VideoBeautify,
    async LinkBeautify(...args) {
        const value = LinkBeautifyFactory().LinkBeautify;
        Object.defineProperty(this, value.name, { value, writable: false });
        value(...args);
    },
    async OriginalImage(...args) {
        const value = OriginalImageFactory().OriginalImage;
        Object.defineProperty(this, value.name, { value, writable: false });
        value(...args);
    },
    async ExtraButton(...args) {
        const value = ExtraButtonFactory().ExtraButton;
        Object.defineProperty(this, value.name, { value, writable: false });
        value(...args);
    },
    CommentFormat,
};

export default contentLoader;