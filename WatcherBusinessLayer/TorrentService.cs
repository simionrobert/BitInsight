using System;
using System.Collections.Generic;
using WatcherDataLayer;
using WatcherDataLayer.Models;

namespace WatcherBusinessLayer
{   
    public class TorrentService : ITorrent
    {
        private ESContext _context;

        public TorrentService(ESContext context)
        {
            _context = context;
        }

        public void Add(Torrent newTorrent)
        {
            
            throw new NotImplementedException();
        }

        public IEnumerable<Torrent> getAll()
        {
            return _context.GetAllTorrents();
        }

        public IEnumerable<Torrent> GetTorrentsByName(String name)
        {
            return _context.GetTorrentsByName(name);
        }


        public IEnumerable<Torrent> GetTorrentsByCategory(String type)
        {
            return _context.GetTorrentsByCategory(type);
        }

        public Torrent getById(string id)
        {
            return _context.GetTorrentByID(id);
        }

        public IEnumerable<IP> getTorrentIPsById(string id)
        {
            return _context.getIPsByTorrent(id);
        }

        public IEnumerable<Torrent> GetAllTorrentsSortedDate()
        {
            return _context.GetAllTorrentsSortedDate();
        }

        public IEnumerable<Torrent> GetAllTorrentsSortedPeers()
        {
            return _context.GetAllTorrentsSortedPeers();
        }
    }
}
