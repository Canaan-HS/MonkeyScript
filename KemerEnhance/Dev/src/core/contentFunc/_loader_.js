import LinkBeautifyFactory from './LinkBeautify.js';
import VideoBeautify from './VideoBeautify.js';
import OriginalImageFactory from './OriginalImage.js';
import ExtraButtonFactory from './ExtraButton.js';
import CommentFormat from './CommentFormat.js';

const contentLoader = {
    VideoBeautify,
    async LinkBeautify(...args) {
        const value = LinkBeautifyFactory().LinkBeautify;
        value(...args);
        Object.defineProperty(this, value.name, { value, writable: false });
    },
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