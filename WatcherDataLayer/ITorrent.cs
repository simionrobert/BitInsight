using System;
using System.Collections.Generic;
using System.Text;
using WatcherDataLayer.Models;

namespace WatcherDataLayer
{
    public interface ITorrent
    {
        //Define series of event that are required

        IEnumerable<Torrent> getAll();
        IEnumerable<Torrent> GetTorrentsByName(String name);
        IEnumerable<Torrent> GetAllTorrentsSortedDate();
        IEnumerable<Torrent> GetAllTorrentsSortedPeers();
        Torrent getById(String id);
        void Add(Torrent newTorrent);
        IEnumerable<IP> getTorrentIPsById(String id);
    }
}
