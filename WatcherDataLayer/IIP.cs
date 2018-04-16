using System;
using System.Collections.Generic;
using System.Text;
using WatcherDataLayer.Models;

namespace WatcherDataLayer
{
    public interface IIP
    {
        IEnumerable<IP> getAll();
        void Add(IP newIP);
        IEnumerable<Torrent> getTorrents(String id);
    }
}
