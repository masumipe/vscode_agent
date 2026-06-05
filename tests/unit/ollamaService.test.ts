import * as assert from 'assert';
import { OllamaService } from '../../src/services/ollamaService';

describe('OllamaService', () => {
    let service: OllamaService;

    beforeEach(() => {
        service = new OllamaService();
    });

    it('should create an instance', () => {
        assert.ok(service);
    });

    it('should have a healthCheck method', () => {
        assert.ok(typeof service.healthCheck === 'function');
    });

    it('should have a chat method', () => {
        assert.ok(typeof service.chat === 'function');
    });

    it('should have a generate method', () => {
        assert.ok(typeof service.generate === 'function');
    });

    it('should return a valid base URL', () => {
        const url = service.getBaseUrl();
        assert.ok(url.startsWith('http'));
    });
});
