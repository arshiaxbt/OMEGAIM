// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OmegaAim {
    struct PlayerStats {
        uint256 totalShots;
        uint256 hits;
        uint256 bestStreak;
        uint256 currentStreak;
        uint256 lastShotTime;
    }

    mapping(address => PlayerStats) public players;
    address[] public playerList;
    mapping(address => bool) private isPlayer;

    uint256 public totalShotsGlobal;
    uint256 public totalPlayersGlobal;

    event Shot(address indexed player, bool hit, uint256 totalShots, uint256 hits, uint256 streak);
    event NewPlayer(address indexed player);

    function shoot(bool _hit) external {
        if (!isPlayer[msg.sender]) {
            isPlayer[msg.sender] = true;
            playerList.push(msg.sender);
            totalPlayersGlobal++;
            emit NewPlayer(msg.sender);
        }

        PlayerStats storage stats = players[msg.sender];
        stats.totalShots++;
        stats.lastShotTime = block.timestamp;
        totalShotsGlobal++;

        if (_hit) {
            stats.hits++;
            stats.currentStreak++;
            if (stats.currentStreak > stats.bestStreak) {
                stats.bestStreak = stats.currentStreak;
            }
        } else {
            stats.currentStreak = 0;
        }

        emit Shot(msg.sender, _hit, stats.totalShots, stats.hits, stats.currentStreak);
    }

    function getPlayerStats(address _player) external view returns (
        uint256 totalShots,
        uint256 hits,
        uint256 bestStreak,
        uint256 currentStreak,
        uint256 lastShotTime
    ) {
        PlayerStats storage s = players[_player];
        return (s.totalShots, s.hits, s.bestStreak, s.currentStreak, s.lastShotTime);
    }

    function getLeaderboardLength() external view returns (uint256) {
        return playerList.length;
    }

    function getPlayerAt(uint256 _index) external view returns (address) {
        return playerList[_index];
    }
}
