#!/bin/zsh
cd -- "${0:A:h}/../.." || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
node scripts/video-studio/setup.mjs "$@"
if [[ $? -ne 0 ]]; then read -r '?按回车关闭。'; fi
