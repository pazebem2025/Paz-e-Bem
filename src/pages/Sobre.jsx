import InformativoDevs from "../components/InformativoDevs"
import InformativoIdealizador from "../components/informativoIdealizador"
import InformativoIgreja from "../components/InformativoIgreja"
import InformativoInovaTec from "../components/InformativoInovaTec"

function Sobre() {
  return (
    <div className="px-3 mt-4 space-y-2">
      <h1 className="text-xl font-bold text-gray-800">Sobre</h1>
      <InformativoIgreja/>
      <InformativoInovaTec/>
      <InformativoDevs/>
      <InformativoIdealizador/>
    </div>
  )
}

export default Sobre
