import numpy as np
# from tones import codec


def encodeAddress32Bit(address) -> np.int32:
    anchor, freq, delta = address
    delta = int(delta)
    # anchor is 9 bits, freq is 9 bits, delta is 14 bits
    return (int(anchor) << 23) | (int(freq) << 14) | delta
    # res = codec.encodeAddress(address)
    # return res


def encodeAddress64Bit(address) -> np.uint64:
    anchor1, anchor2, anchor3, freq, avgDelta, delta1 = address  # Subject to change
    # each anchor is 9bits, freq is 9 bits and each delta is 14 bits
    res = (
        (int(anchor1) << 55)
        | (int(anchor2) << 46)
        | (int(anchor3) << 37)
        | (int(freq) << 28)
        | (int(avgDelta) << 14)
        | delta1
    )
    return res


def decodeAddress32Bit(encoded):
    anchor = (int(encoded) >> 23) & 0x1FF
    freq = (int(encoded) >> 14) & 0x1FF
    delta = int(encoded) & 0x3FFF
    return anchor, freq, delta
    # res = codec.decodeAddress(encoded)
    # anchor, freq, delta = res
    # return anchor, freq, delta


def decodeAddress64Bit(encoded):
    anchor1 = (int(encoded) >> 55) & 0x1FF
    anchor2 = (int(encoded) >> 46) & 0x1FF
    anchor3 = (int(encoded) >> 37) & 0x1FF
    freq = (int(encoded) >> 28) & 0x1FF
    avgDelta = (int(encoded) >> 14) & 0x3FFF
    delta1 = int(encoded) & 0x3FFF
    return anchor1, anchor2, anchor3, freq, avgDelta, delta1


def encodeCouple64Bit(couple) -> np.int64:
    anchorTime, songId = couple
    # anchorTime is 32 bits, songId is 32 bits
    return (int(anchorTime) << 32) | songId
    # res = codec.encodeCouple(couple)
    # return res


def decodeCouple64Bit(encoded):
    anchorTime = (int(encoded) >> 32) & 0xFFFFFFFF
    songId = int(encoded) & 0xFFFFFFFF
    return anchorTime, songId
    # res = codec.decodeCouple(encoded)
    # return res
