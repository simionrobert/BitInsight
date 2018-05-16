using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Watcher.Controllers
{
    public static class Utils
    {
        public static bool ValidateIPv4(ref string ipString)
        {
            if (String.IsNullOrWhiteSpace(ipString))
            {
                return false;
            }
            
            ipString = ipString.Trim();
            string[] splitValues = ipString.Split('.');
            if (splitValues.Length != 4)
            {
                return false;
            }

            byte tempForParsing;

            return splitValues.All(r => byte.TryParse(r, out tempForParsing));
        }
    }


}
