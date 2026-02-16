import VideoBeautify from './VideoBeautify.js';
import CommentFormat from './CommentFormat.js';
import ExtraButtonFactory from './ExtraButton.js';
import LinkBeautifyFactory from './LinkBeautify.js';
import OriginalImageFactory from './OriginalImage.js';

const contentLoader = {
    async LinkBeautify(...args) {
        const value = LinkBeautifyFactory().LinkBeautify;
        value(...args);
        Object.defineProperty(this, value.name, { value, writable: false });
    },
    VideoBeautify,
    async OriginalImage(...args) {
        const value = OriginalImageFactory().OriginalImage;
        value(...args);
        Object.defineProperty(this, value.name, { value, writable: false });
    },
    async ExtraButton(...args) {
        const value = ExtraButtonFactory().ExtraButton;
        value(...args);
        Object.defineProperty(this, value.name, { value, writable: false });
    },
    CommentFormat,
};

export default contentLoader;