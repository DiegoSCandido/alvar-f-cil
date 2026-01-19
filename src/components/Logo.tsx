import logo2controle from "../assets/o2contole-logo.png";

const Logo = () => {
    return (
        <div className="flex flex-col items-center gap-3">
      {/* Logo Image */}
      <img
        src={logo2controle}
        alt="O2con Soluções Contábeis"
        className="w-48 sm:w-56 md:w-64 h-auto"
      />
    </div> 
    )
}

export default Logo;