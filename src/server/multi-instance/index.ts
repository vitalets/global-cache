/**
 * Multi-instance mode of Global Storage Server.
 * - can't reliably write to fs
 * - can't wait for value via memory, as "set" request can land on another instance
 * - both non-persistent and persistent values are stored in the external storage (redis/firebase)
 * - waiting for value uses storage notifcations (redis/firebase)
 */
