using System;
using System.Collections.Generic;
using System.Text;
using WatcherDataLayer;
using WatcherDataLayer.Models;

namespace WatcherBusinessLayer
{   
    public class IPService : IIP
    {
        private ESContext _context;

        public IPService(ESContext context)
        {
            _context = context;
        }

        public void Add(IP newIP)
        {
            throw new NotImplementedException();
        }

        public IEnumerable<IP> getAll()
        {
            return _context.getAllIPs();
        }

        public IEnumerable<Torrent> getTorrents(string ip)
        {
            return _context.getTorrentsByIP(ip);
        }
    }
}
